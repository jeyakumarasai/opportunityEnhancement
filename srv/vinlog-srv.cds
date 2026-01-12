using {
  db.vinlog.vinheader,
  db.vinlog.vinsuccess,
  db.vinlog.vinfailure,
  db.vinlog.historicvindata_header,
  db.vinlog.historicvindata_items
} from '../db/vinlog-data';


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
  entity vinHeaderSrv @(restrict: [
    {
      grant: 'READ',
      to   : 'Reader'
    },
    {
      grant: 'CREATE',
      to   : 'Writer'
    },
    {
      grant: 'UPDATE',
      to   : 'Writer'
    },
    {
      grant: 'DELETE',
      to   : 'Writer'
    }
  ]) as
    projection on vinheader {
      *,
      items_success : redirected to vinSuccessSrv,
      items_failure : redirected to vinFailureSrv
    };

  entity vinSuccessSrv @(restrict: [
    {
      grant: 'READ',
      to   : 'Reader'
    },
    {
      grant: 'CREATE',
      to   : 'Writer'
    },
    {
      grant: 'UPDATE',
      to   : 'Writer'
    },
    {
      grant: 'DELETE',
      to   : 'Writer'
    }
  ]) as projection on vinsuccess;

  entity vinFailureSrv @(restrict: [
    {
      grant: 'READ',
      to   : 'Reader'
    },
    {
      grant: 'CREATE',
      to   : 'Writer'
    },
    {
      grant: 'UPDATE',
      to   : 'Writer'
    },
    {
      grant: 'DELETE',
      to   : 'Writer'
    }
  ]) as projection on vinfailure;

  @odata.draft.enabled
  entity historicvindata_HeaderSrv @(restrict: [
    {
      grant: 'READ',
      to   : 'Reader'
    },
    {
      grant: 'CREATE',
      to   : 'Writer'
    },
    {
      grant: 'UPDATE',
      to   : 'Writer'
    },
    {
      grant: 'DELETE',
      to   : 'Writer'
    }
  ]) as projection on historicvindata_header;

  entity HistoricVinData_ItemsSrv @(restrict: [
    {
      grant: 'READ',
      to   : 'Reader'
    },
    {
      grant: 'CREATE',
      to   : 'Writer'
    },
    {
      grant: 'UPDATE',
      to   : 'Writer'
    },
    {
      grant: 'DELETE',
      to   : 'Writer'
    }
  ]) as projection on historicvindata_items;


  action uploadCSV @(requires: 'Writer')(opportunityID: String(35), content: LargeString) returns String;

  action Update(opportunityID: String)                                                    returns Boolean;

  @open
  type object {};

  action OpportunityUpdate(entity: String,
                           beforeImage: object,
                           currentImage: object,
                           context: object)                                               returns object;

  action uploadMiGTemp(opportunityID: String(35), content: LargeString)                   returns String;


}
