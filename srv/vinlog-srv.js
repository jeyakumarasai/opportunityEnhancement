const cds = require('@sap/cds');
const axios = require('axios');
const { SELECT, INSERT, DELETE, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const { parse } = require('csv-parse/sync');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { contentType } = require('express/lib/response');
const { destinationCache } = require('@sap-cloud-sdk/connectivity/dist/scp-cf');

module.exports = cds.service.impl(async function () {
  const { vinHeaderSrv } = this.entities;
  const VinHeader = cds.entities['db.vinlog.vinheader'];
  const VinFailure = cds.entities['db.vinlog.vinfailure'];
  const VinSuccess = cds.entities['db.vinlog.vinsuccess'];
  var vincount = 0;
  const salescloud = await cds.connect.to('OpportunityService');
  const historic = await cds.connect.to('vinhistoric');
  //const historicdata = await cds.connect.to('vinhistoric');
  //Upload CSV logic
  const log = cds.log('uploadCSV');
  let mess = " ";
  this.on('uploadCSV', async (req) => {
    try {
      if(!historic)
      {
        successMessage = "Unable to fetch destination vinhistoric";
        return successMessage
      } 
     const { HistoricVinData_ItemsSrv } = historic.entities;
     if(!HistoricVinData_ItemsSrv)
     {
        successMessage = "Unable to fetch entities HistoricVinData_ItemsSrv";
        return successMessage
     }
      log.info("handler reached");
      mess = "handler reached";
      const { opportunityID, content } = req.data;
      let records = parse(content, { columns: true, skip_empty_lines: true });
      console.log(`Parsed ${records.length} records for opportunity ${opportunityID}`);
      log.info(`Parsed ${records.length} records for opportunity ${opportunityID}`);
      mess = `Parsed ${records.length} records for opportunity ${opportunityID}`;

      //Call Opportunity Odata
      var successMessage;
      var uploadFlag = true;
      let restAPIResponse;
      try {
        restAPIResponse = await salescloud.send({
          method: 'GET',
          path: `/sap/c4c/api/v1/opportunity-service/opportunities?$filter=displayId eq '${opportunityID}'`,
          headers: { Accept: 'application/json' }
        });
        mess = "executed opportuity REST API";
      } catch (err) {
        console.error("Failed to fetch opportunity:", err.message);
        successMessage = "Unable to fetch opportunity details";
        log.info("Failed to fetch opportunity");
        return { successMessage  };
      }

      //const historic = await cds.connect.to('vinhistoric');
      const value = restAPIResponse.value[0];
      if (!value) {
        successMessage = "Opportunity not found";
        log.info("Opportunity not found");
        return {successMessage };
      }

      if (value.documentType !== "ZFO") {
        successMessage = "Only ZFO opportunities are supported";
        return {  successMessage };
      }

      const exitsVinucces = await SELECT.one.from(VinSuccess)
        .where({ dateTime: { '!=': null } })
        .orderBy('dateTime asc');
      if (exitsVinucces) {
        const dateTimeStr = exitsVinucces.dateTime;
        const targetDate = new Date(dateTimeStr);
        const today = new Date();
        const targetOnlyDate = new Date(targetDate.toDateString());
        const todayOnlyDate = new Date(today.toDateString());
        const diffMs = todayOnlyDate - targetOnlyDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= 365) {
          uploadFlag = false;
        }
      } else {
        mess = "failed reading Vinsucces";
      }
      if (uploadFlag == false) {
        successMessage = "You have exceded the 12 month period for conquest credit. Please enter a new maintenance opportunity";
        return successMessage;
      }
      //Checking Duplicate VIN ID is Upload in Csv file
      const duplicates = []
      const seen = new Set()
      records = records.filter(rec => {
        if (seen.has(rec.VINID)) {
          duplicates.push(rec.VINID);
          return false;
        }
        seen.add(rec.VINID)
        return true;
      })
      console.log("executed duplicate check")
      //Get existing VINs from DB
      const existingVINs = await SELECT.from(VinSuccess, ['vinID']).where({ parent_opportunityID: opportunityID });
      console.log("executed vin success query check")
      const errorexistingVINs = await SELECT.from(VinFailure, ['vinID']).where({ parent_opportunityID: opportunityID });
      console.log("executed vin failure query check")
      const existingSet = new Set(existingVINs.map(r => r.vinID));
      //  Filter out VINs already in DB 
      const newRecords = records.filter(rec => !existingSet.has(rec.VINID));

      if (newRecords.length > 0) { // If uploaded VINs not availble in Vin Success table or failure table , proceed further
        const entensionfield = value.extensions;
        const oe = entensionfield['A1DNA-OE'];
        const items = value.items;
        const account = value.account;
        const vincount = entensionfield['A1DNA-VinCount']
        var count = 0;

        for (const item of newRecords) {
          console.log(item.VINID)
          //Call Nhsta API to get details for uplaoded VIN ID
          const nhsta = await cds.connect.to('NHTSA');
          var result;
          try {
            const response = await nhsta.send({
              method: 'GET',
              path: `/api/vehicles/DecodeVINValues/${item.VINID}?format=json`,
              headers: { Accept: 'application/json' }
            });
            result = response.Results[0];
          } catch (e) {
              successMessage = "failure to fetch VIN details in NHTSA";
              log.info("ailure to fetch VIN details in NHTSA");
            return successMessage ;
          }

          if (result.ErrorCode == 0) // Check response code from API
          {
            if (oe == result.MakeID) {                  // Check if opportunity OE is matching with API OE
              console.log("OE value is matching")
              var resultItem ;
              try {
                 resultItem = await historic.run(SELECT.from(HistoricVinData_ItemsSrv).where({ vinID: item.VINID }))
              } catch (error) {
                successMessage = "Reading Data from Vinhistoric is failed";
                  return  successMessage ;
              }
              if (resultItem.length == 0) {
                //----------------------------------------------------------------------------
                var newEntrySucc = {
                  vinID: item.VINID,
                  make_OE: result.MakeID,
                  model: result.ModelID,
                  year: result.ModelYear,
                  duplicates: "No",
                  customerID: account.displayId,
                  parent_opportunityID: opportunityID

                };
                await INSERT.into(VinSuccess).entries(newEntrySucc);
                successMessage = "Process Completed";

              } else {
                console.log("reached  Historic Table Validation")
                var exists = errorexistingVINs.some(r => r.vinID === item.VINID)
                if (!exists) {
                  var mess = "VIN " + item.VINID + " is already used for product " + resultItem[0].productID + " for " + resultItem[0].parent_opportunityID + " oppty ID. This will be removed from your VIN Count";
                  var newEntryHist = {
                    errorMessage: mess,
                    vinID: item.VINID,
                    make_OE: result.MakeID,
                    model: result.ModelID,
                    year: result.ModelYear,
                    dateTime: new Date(),   // auto set current timestamp
                    duplicate: "Yes",
                    parent_opportunityID: opportunityID
                  };
                  await INSERT.into(VinFailure).entries(newEntryHist);
                  console.log("failed data inserted Sucessfully");
                }
                successMessage = "Process Completed";
              }

            } else { // OE is not matching with Nhsta 
              console.log("reached else part")
              var exists = errorexistingVINs.some(r => r.vinID === item.VINID)
              if (!exists) {
                var newEntry1 = {
                  errorMessage: "OE on the Oppty is different than the NHTSA ",
                  vinID: item.VINID,
                  make_OE: result.MakeID,
                  model: result.ModelID,
                  year: result.ModelYear,
                  dateTime: new Date(),   // auto set current timestamp
                  parent_opportunityID: opportunityID
                };
                await INSERT.into(VinFailure).entries(newEntry1);
              }
              console.log("failed data inserted Sucessfully");
              successMessage = "Process Completed";
            }
          } else  // API Fails
          {
            var exists1 = errorexistingVINs.some(r => r.vinID === item.VINID)
            if (!exists1) {
              var newEntry = {
                errorMessage: result.ErrorText,
                vinID: item.VINID,
                make_OE: result.MakeID,
                model: result.ModelID,
                year: result.ModelYear,
                dateTime: new Date(),   // auto set current timestamp
                parent_opportunityID: opportunityID
              };
              await INSERT.into(VinFailure).entries(newEntry);
            }
            console.log("failed data inserted Sucessfully");
            successMessage = "Process Completed";
          }
        }
      }
      if (duplicates.length > 0) {
        var dupMessage = 'The uploaded VINs contain one or more duplicate values. The duplicate values have been removed from the VIN table'
        return dupMessage;
      }
      else if (records.length > newRecords.length) {
        var skipped = records.filter(rec => !newRecords.some(nr => nr.VINID === rec.VINID))
        var message = `Some VINs already exist in VinSuccess: ${skipped.map(r => r.VINID).join(', ')}`;
        return message;
      }
      else {
        return successMessage;
      }
    } catch (err) {
      console.error("Unexpected error in uploadCSV:", err.message);
      successMessage = "Unexpected error occurred during upload";
      successMessage = successMessage + mess;
      return successMessage ;
    }
  });



  //Check if OpportunityUUID exits in HANA or create  entry 
  this.before('READ', 'vinHeaderSrv', async (req) => {
    if (req.params && req.params.length > 0) {
      console.log("Reached Read process")
      const opportunityID = req.params[0].opportunityID;
      if (opportunityID.length == 0) {
        console.log("Opportunity UUID not passed")
      }

      console.log(opportunityID)
      const tx = cds.tx(req);
      const exists1 = await tx.run(SELECT.one.from(vinHeaderSrv).columns('opportunityID').where({ opportunityID: opportunityID }));
      if (exists1) {
        console.log("data is available")
        console.log(exists1.opportunityID)
      } else if (!exists1) {
        console.log("data is not available")
        await INSERT.into(VinHeader).entries(req.data);
        console.log("data is inserted successfully")
      }
    }
  });

  this.after('DELETE', 'vinSuccessSrv', async (deletedEntities, req) => {
    console.log("deletion reached vinSuccess active");
    //const historicdata = await cds.connect.to('vinhistoric');
    const tx2 = cds.tx(req);
    for (const param of req.params) {
      if (param.ID) {
        try {
          const row = await tx2.run(SELECT.one.from('vinsuccess').columns('vinID').where({ ID: param.ID }));
          if (row && row.vinID) {
            await historic.run(
              DELETE.from('vinhistoric.HistoricVinData_ItemsSrv').where({ vinID: row.vinID, IsActiveEntity: true }));
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    return "updated uccessfully";
  });

  this.after('DELETE', 'vinSuccessSrv.drafts', async (deletedEntities, req) => {
    console.log("deletion reached vinSuccess drafts");
    // const historicdata1 = await cds.connect.to('vinhistoric');
    const tx1 = cds.tx(req);
    for (const param of req.params) {
      if (param.ID) {
        try {
          const row = await tx1.run(SELECT.one.from('vinsuccess').columns('vinID').where({ ID: param.ID }))
          if (row && row.vinID) {
            await historic.run(
              DELETE.from('vinhistoric.HistoricVinData_ItemsSrv').where({ vinID: row.vinID }));
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    return "updated successfully";
  });

  this.after('UPDATE', 'vinSuccessSrv.drafts', async (UpdatedEntities, req) => {
    console.log("Update reached vinSuccess drafts");
    const txUp = cds.tx(req);
    var opportunityID;
    for (const param of req.params) {
      if (param.opportunityID) {
        try {
          opportunityID = param.opportunityID;
          const rows = await SELECT.from(VinSuccess).where({ parent_opportunityID: param.opportunityID })
          const vinSuccesUpdateRes = rows;
          if (rows) {
            var UpdatepayloadQ;
            var q1Vincount = 0;
            var q1SpecValue = 0;
            var q2Vincount = 0;
            var q2SpecValue = 0;
            var q3Vincount = 0;
            var q3SpecValue = 0;
            var q4Vincount = 0;
            var q4SpecValue = 0;
            var total = 0;
            vinSuccesUpdateRes.forEach(async element => {
              var dt = new Date(element.dateTime);
              var year = dt.getFullYear();
              var month = dt.getMonth() + 1; // 1–12
              var day = dt.getDate();
              if (month >= 1 && month <= 3) {
                q1Vincount = q1Vincount + 1;
              }
              else if (month >= 4 && month <= 6) {
                q2Vincount = q2Vincount + 1;
              } else if (month >= 7 && month <= 9) {
                q3Vincount = q3Vincount + 1;
              } else if (month >= 10 && month <= 12) {
                q4Vincount = q4Vincount + 1;
              }
            });
            try {
              const APIResponse = await salescloud.send({
                method: 'GET',
                path: `/sap/c4c/api/v1/opportunity-service/opportunities?$filter=displayId eq '${opportunityID}'`,
                headers: { Accept: 'application/json' }
              });
              const APIResponseValue = APIResponse.value[0];
              const entensionfield = APIResponseValue.extensions;
              const ETag = APIResponseValue.adminData.updatedOn;
              const vinCount = rows.length;
              q1SpecValue = Number(q1Vincount) * Number(entensionfield.SpecValueUnit.content);
              q2SpecValue = Number(q2Vincount) * Number(entensionfield.SpecValueUnit.content);
              q3SpecValue = Number(q3Vincount) * Number(entensionfield.SpecValueUnit.content);
              q4SpecValue = Number(q4Vincount) * Number(entensionfield.SpecValueUnit.content);
              total = Number(q1SpecValue) + Number(q2SpecValue) + Number(q3SpecValue) + Number(q4SpecValue);
              UpdatepayloadQ = {
                "extensions":
                {
                  "A1DNA-VinCount": String(vinCount),
                  "Q1VinCount": Number(q1Vincount),
                  "Q1SpecValue": {
                    "content": Number(q1SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "Q2VINCount": Number(q2Vincount),
                  "Q2SpecValue": {
                    "content": Number(q2SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "Q3VINCount": Number(q3Vincount),
                  "Q3SpecValue": {
                    "content": Number(q3SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "Q4VINCount": Number(q4Vincount),
                  "Q4SpecValue": {
                    "content": Number(q4SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "SpecValueQ1": {
                    "content": Number(total),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  }

                }
              };
              if (UpdatepayloadQ) {
                try {
                  const respQ1 = await salescloud.send({
                    method: 'PATCH', path: `/sap/c4c/api/v1/opportunity-service/opportunities/${APIResponseValue.id}`,
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'If-Match': ETag
                    },
                    data: UpdatepayloadQ
                  });

                } catch (e) {
                  console.error('STATUS:', e.reason?.response?.status);
                  console.error('HEADERS:', e.reason?.response?.headers);
                  console.error('BODY:', JSON.stringify(e.reason?.response?.data, null, 2));
                  throw e;
                }
              }
            } catch (e) {
              console.error('STATUS:', e.reason?.response?.status);
              console.error('HEADERS:', e.reason?.response?.headers);
              console.error('BODY:', JSON.stringify(e.reason?.response?.data, null, 2));
              throw e;
            }
          }

        } catch (error) {
          console.log(error);
        }
      }
    }
    return "updated successfully";
  });

  this.after('UPDATE', 'vinSuccessSrv', async (UpdatedEntities, req) => {
    console.log("Update reached vinSuccess drafts");
    const txUp = cds.tx(req);
    var opportunityID;
    for (const param of req.params) {
      if (param.opportunityID) {
        try {
          opportunityID = param.opportunityID;
          const rows = await SELECT.from(VinSuccess).where({ parent_opportunityID: param.opportunityID })
          const vinSuccesUpdateRes = rows;
          if (rows) {
            var UpdatepayloadQ;
            var q1Vincount = 0;
            var q1SpecValue = 0;
            var q2Vincount = 0;
            var q2SpecValue = 0;
            var q3Vincount = 0;
            var q3SpecValue = 0;
            var q4Vincount = 0;
            var q4SpecValue = 0;
            var total = 0;
            vinSuccesUpdateRes.forEach(async element => {
              var dt = new Date(element.dateTime);
              var year = dt.getFullYear();
              var month = dt.getMonth() + 1; // 1–12
              var day = dt.getDate();
              if (month >= 1 && month <= 3) {
                q1Vincount = q1Vincount + 1;
              }
              else if (month >= 4 && month <= 6) {
                q2Vincount = q2Vincount + 1;
              } else if (month >= 7 && month <= 9) {
                q3Vincount = q3Vincount + 1;
              } else if (month >= 10 && month <= 12) {
                q4Vincount = q4Vincount + 1;
              }
            });
            try {
              const APIResponse = await salescloud.send({
                method: 'GET',
                path: `/sap/c4c/api/v1/opportunity-service/opportunities?$filter=displayId eq '${opportunityID}`,
                headers: { Accept: 'application/json' }
              });
              const APIResponseValue = APIResponse.value[0];
              const entensionfield = APIResponseValue.extensions;
              const ETag = APIResponseValue.adminData.updatedOn;
              const vinCount = rows.length;
              q1SpecValue = Number(q1Vincount) * Number(entensionfield.SpecValueUnit.content);
              q2SpecValue = Number(q2Vincount) * Number(entensionfield.SpecValueUnit.content);
              q3SpecValue = Number(q3Vincount) * Number(entensionfield.SpecValueUnit.content);
              q4SpecValue = Number(q4Vincount) * Number(entensionfield.SpecValueUnit.content);
              total = Number(q1SpecValue) + Number(q2SpecValue) + Number(q3SpecValue) + Number(q4SpecValue);
              UpdatepayloadQ = {
                "extensions":
                {
                  "A1DNA-VinCount": String(vinCount),
                  "Q1VinCount": Number(q1Vincount),
                  "Q1SpecValue": {
                    "content": Number(q1SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "Q2VINCount": Number(q2Vincount),
                  "Q2SpecValue": {
                    "content": Number(q2SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "Q3VINCount": Number(q3Vincount),
                  "Q3SpecValue": {
                    "content": Number(q3SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "Q4VINCount": Number(q4Vincount),
                  "Q4SpecValue": {
                    "content": Number(q4SpecValue),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  },
                  "SpecValueQ1": {
                    "content": Number(total),
                    "currencyCode": String(APIResponseValue.totalExpectedNetAmount.currencyCode)
                  }

                }
              };
              if (UpdatepayloadQ) {
                try {
                  const respQ1 = await salescloud.send({
                    method: 'PATCH', path: `/sap/c4c/api/v1opportunity-service/opportunities/${APIResponseValue.id}`,
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'If-Match': ETag
                    },
                    data: UpdatepayloadQ
                  });

                } catch (e) {
                  console.error('STATUS:', e.reason?.response?.status);
                  console.error('HEADERS:', e.reason?.response?.headers);
                  console.error('BODY:', JSON.stringify(e.reason?.response?.data, null, 2));
                  throw e;
                }
              }
            } catch (e) {
              console.error('STATUS:', e.reason?.response?.status);
              console.error('HEADERS:', e.reason?.response?.headers);
              console.error('BODY:', JSON.stringify(e.reason?.response?.data, null, 2));
              throw e;
            }
          }

        } catch (error) {
          console.log(error);
        }
      }
    }
    return "updated successfully";
  });
});