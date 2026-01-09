sap.ui.define([ "sap/ui/core/mvc/Controller", "sap/m/MessageToast" ], 
    function (Controller, MessageToast,MessageBox) 
    { "use strict";
        console.log("VinHeaderObjectPageExt loaded");
    
        function _createUploadController(oExtensionAPI) {


            var oUploadDialog;
            function setOkButtonEnabled(bOk) {
                oUploadDialog && oUploadDialog.getBeginButton().setEnabled(bOk);
            }
            function setDialogBusy(bBusy) {
                oUploadDialog.setBusy(bBusy)
            }
            function closeDialog() {
                oUploadDialog && oUploadDialog.close()
            }
            function showError(sMessage) {
                MessageBox.error(sMessage || "Upload failed")
            }
            // TODO: Better option for this?
            function byId(sId) {
                return sap.ui.core.Fragment.byId("uploadDialog", sId);
            }
            return {
                onBeforeOpen: function (oEvent) {
                    oUploadDialog = oEvent.getSource();
                    oExtensionAPI.addDependent(oUploadDialog);
                },
                onAfterClose: function (oEvent) {
                    oExtensionAPI.removeDependent(oUploadDialog);
                    oUploadDialog.destroy();
                    oUploadDialog = undefined;
                },
                  onFileChange: function (oEvent) {
                         const file = oEvent.getParameter("files")?.[0];
                         if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (e) => {
                        this._csvText = e.target.result;
                        MessageToast.show("CSV loaded. Click Process.");
                       };
                       reader.onerror = () => MessageToast.show("Failed to read file.");
                       reader.readAsText(file);
    },
                onOk: function (oEvent) {

                  if (!this._csvText) {
                 return MessageToast.show("Please select a CSV file first.");
                   }
                    fetch("/odata/v4/vinlog/uploadCSV", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        opportunityID: this._vinKey,
                        content      : this._csvText })
                   })
                    .then(async (res) => {
                     if (!res.ok) throw new Error(await res.text());
                    return res.json();
                      })
                       .then((data) => {
                       // OData V4 returns the action result as { value: [...] }
                          const rows = data?.value ?? data;
                          //this.getView().getModel("result").setData(rows || []);
                         MessageToast.show("Processing complete.");
                         closeDialog();
                       })
                        .catch((err) => {
                         console.error(err);
                         MessageToast.show("Error processing CSV.");
                      });
                    //setDialogBusy(true)
                   // var oFileUploader = byId("uploader")
                   // oFileUploader
                     //   .checkFileReadable()
                     //   .then(function () {
                      //      oFileUploader.upload();
                           // closeDialog();
                       // })
                        //.catch(function (error) {
                         //   showError("The file cannot be read.");
                       //     setDialogBusy(false)
                      //  })
                },
                onCancel: function (oEvent) {
                    closeDialog();
                },
                onTypeMismatch: function (oEvent) {
                    var sSupportedFileTypes = oEvent
                        .getSource()
                        .getFileType()
                        .map(function (sFileType) {
                            return "*." + sFileType;
                        })
                        .join(", ");
                    showError(
                        "The file type *." +
                        oEvent.getParameter("fileType") +
                        " is not supported. Choose one of the following types: " +
                        sSupportedFileTypes
                    );
                },
                onFileAllowed: function (oEvent) {
                    setOkButtonEnabled(true)
                },
                onFileEmpty: function (oEvent) {
                    setOkButtonEnabled(false)
                },
                onUploadComplete: function (oEvent) {
                    var iStatus = oEvent.getParameter("status");
                    var oFileUploader = oEvent.getSource()
                    oFileUploader.clear();
                    setOkButtonEnabled(false)
                    setDialogBusy(false)
                    if (iStatus >= 400) {
                        var oRawResponse = JSON.parse(oEvent.getParameter("responseRaw"));
                        showError(oRawResponse && oRawResponse.error && oRawResponse.error.message);
                    } else {
                        MessageToast.show("Uploaded successfully");
                        oExtensionAPI.refresh()
                        closeDialog();
                    }
                }
            };
        }
         return Controller.extend("vnlog.ext.controller.VinHeaderObjectPageExt", 
            { 
             
                
                onInit: function () { 
                       console.log("init method trigered");
                var oRouter = this.getOwnerComponent().getRouter(); 
                oRouter.getRoute("vinHeaderSrvObjectPage") .attachPatternMatched(this._onObjectMatched, this); 
            }, 

                _onObjectMatched: function (oEvent) {
                console.log("Route arguments:", oEvent.getParameter("arguments"));
                   var args = oEvent.getParameter("arguments"); // Fiori Elements usually passes contextPath 
                   var sContextPath = args.contextPath; 
                   if (sContextPath) { 
                    var match = /'([^']+)'/.exec(sContextPath); 
                    if (match) { 
                        this._vinKey = match[1]; 
                        sap.m.MessageToast.show("VIN Key: " + this._vinKey); 
                        console.log("Matched VIN Key:", this._vinKey); 
                        return; } } // fallback if contextPath is not there 
                        
                        if (args.key) {
                             this._vinKey = args.key; 
                             sap.m.MessageToast.show("VIN Key: " + this._vinKey); 
                             console.log("Matched VIN Key:", this._vinKey); 
                            }

                    } ,

              onAfterAction: function(oEvent) { 
                var oTable = this.byId("vinFailureSrvObjectPage"); 
                var oBinding = oTable.getBinding("items"); 
                if (oBinding) 
                    { oBinding.refresh(); // ensures table shows new rows 
                        } }


        
                }); 
            }
        ,
    );