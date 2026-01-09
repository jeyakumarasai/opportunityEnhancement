using { db.vinlog.vinheader , db.vinlog.vinsuccess, db.vinlog.vinfailure} from '../db/vinlog-data';


service vinlogService  {

    @UI.HeaderInfo: {
    TypeName: 'Vin Log',
    TypeNamePlural: 'Opportunities',
    Title: { Value: opportunityUUID }
  }
  type ProcessedRow {
    Vin    : String;
   }
  
  @odata.draft.enabled
  entity vinHeaderSrv @(restrict: [
  { grant: 'READ', to: 'Reader' },
  { grant: 'CREATE', to: 'Writer' },
  { grant: 'UPDATE', to: 'Writer' },
  { grant: 'DELETE', to: 'Writer' }]) as projection on vinheader  {
    *,
     items_success : redirected to vinSuccessSrv,
     items_failure : redirected to vinFailureSrv
  };
  entity  vinSuccessSrv @(restrict: [
  { grant: 'READ', to: 'Reader' },
  { grant: 'CREATE', to: 'Writer' },
  { grant: 'UPDATE', to: 'Writer' },
  { grant: 'DELETE', to: 'Writer' }])  as projection on vinsuccess;

  entity vinFailureSrv @(restrict: [
  { grant: 'READ', to: 'Reader' },
  { grant: 'CREATE', to: 'Writer' },
  { grant: 'UPDATE', to: 'Writer' },
  { grant: 'DELETE', to: 'Writer' }])  as projection on vinfailure;

  action uploadCSV  @(requires: 'Writer') (opportunityID : String(35),content : LargeString)  returns String  ;



}

