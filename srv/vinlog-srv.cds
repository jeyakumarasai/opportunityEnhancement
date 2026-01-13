using {
  db.vinlog.vinheader,
  db.vinlog.vinsuccess,
  db.vinlog.vinfailure,
  db.vinlog.historicvindata_header,
  db.vinlog.historicvindata_items
} from '../db/vinlog-data';

@(requires: 'authenticated-user')
service vinlogService {

  @UI.HeaderInfo: {
    TypeName      : 'Vin Log',
    TypeNamePlural: 'Opportunities',
    Title         : {Value: opportunityUUID}
  }
  type ProcessedRow {
    Vin : String;
  }

  @odata.draft.enabled
  @cds.redirection.target: true
  entity vinHeaderSrv  as
    projection on vinheader {
      *,
      items_success : redirected to vinSuccessSrv,
      items_failure : redirected to vinFailureSrv
    };

  entity vinSuccessSrv  as projection on vinsuccess;

  entity vinFailureSrv  as projection on vinfailure;

  @odata.draft.enabled
  @cds.redirection.target: true
  entity historicvindata_HeaderSrv  as projection on historicvindata_header {
    *,
    items : redirected to HistoricVinData_ItemsSrv
  };

  entity HistoricVinData_ItemsSrv  as projection on historicvindata_items;


  action uploadCSV(opportunityID: String(35), content: LargeString)     returns String;

  action Update(opportunityID: String)                                  returns Boolean;

  @open
  type object {};

  action OpportunityUpdate(entity: String,
                           beforeImage: object,
                           currentImage: object,
                           context: object)                             returns object;

  action uploadMiGTemp(opportunityID: String(35), content: LargeString) returns String;


}
