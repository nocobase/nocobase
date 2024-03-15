import { SchemaInitializer } from './SchemaInitializer';

/**
 * @internal
 *
 * 因为需要把 SchemaInitializer 的 name 统一为一致的命名风格，统一之后新创建的 Schema 将
 * 使用新的命名风格，而旧的 Schema 仍然使用旧的命名风格，这样会导致一些问题。所以需要有一个方法
 * 可以确保旧版的 name 也可以正常工作，直到旧的 Schema 被移除。该类就是用来兼容旧 name 的：
 *
 * 1. 在新版实例中通过接收旧版 name 的实例，在新版实例变更后，同步变更旧版实例；
 * 2. 在旧版实例中也接收新版 name 的实例，当旧版实例变更后，同步变更新版实例，这样可以保证在插件中即使不把旧版改成新版也能正常运行；
 */
export class CompatibleSchemaInitializer extends SchemaInitializer {
  /**
   * 需要同步变更的另一个实例
   */
  otherInstance: CompatibleSchemaInitializer = null;

  constructor(options: any, otherInstance?: CompatibleSchemaInitializer) {
    super(options);
    if (otherInstance) {
      this.otherInstance = otherInstance;
      otherInstance.otherInstance = this;
    }
  }

  add(name: string, item: any) {
    if (super.get(name)) return;

    super.add(name, item);
    if (this.otherInstance) {
      this.otherInstance.add(name, item);
    }
  }

  remove(nestedName: string): void {
    if (!super.get(nestedName)) return;

    super.remove(nestedName);
    if (this.otherInstance) {
      this.otherInstance.remove(nestedName);
    }
  }
}

const oldToNewNameMap = {
  BlockInitializers: 'page:addBlock',
  MBlockInitializers: 'mobilePage:addBlock',
  CreateFormBlockInitializers: 'popup:addNew:addBlock',
  CusomeizeCreateFormBlockInitializers: 'popup:addRecord:addBlock',
  RecordBlockInitializers: 'popup:common:addBlock',
  BulkEditBlockInitializers: 'popup:bulkEdit:addBlock',
  TableColumnInitializers: 'table:configureColumns',
  TableActionColumnInitializers: 'table:configureItemActions',
  TableActionInitializers: 'table:configureActions',
  SubTableActionInitializers: 'subTable:configureActions',
  FormItemInitializers: 'form:configureFields',
  CreateFormActionInitializers: 'createForm:configureActions',
  UpdateFormActionInitializers: 'editForm:configureActions',
  ReadPrettyFormItemInitializers: 'details:configureFields',
  DetailsActionInitializers: 'detailsWithPaging:configureActions',
  ReadPrettyFormActionInitializers: 'details:configureActions',
  KanbanCardInitializers: 'kanban:configureItemFields',
  KanbanActionInitializers: 'kanban:configureActions',
  GridCardActionInitializers: 'gridCard:configureActions',
  GridCardItemActionInitializers: 'gridCard:configureItemActions',
  ListActionInitializers: 'list:configureActions',
  ListItemActionInitializers: 'list:configureItemActions',
  CalendarActionInitializers: 'calendar:configureActions',
  GanttActionInitializers: 'gantt:configureActions',
  MapActionInitializers: 'map:configureActions',
  TableSelectorInitializers: 'popup:tableSelector:addBlock',
  ChartInitializers: 'charts:addBlock',
  ChartFilterItemInitializers: 'chartFilterForm:configureFields',
  ChartFilterActionInitializers: 'chartFilterForm:configureActions',
  AssociationFilterInitializers: 'filterCollapse:configureFields',
  FilterFormItemInitializers: 'filterForm:configureFields',
  FilterFormActionInitializers: 'filterForm:configureActions',
  CustomFormItemInitializers: 'assignFieldValuesForm:configureFields',
  BulkEditFormItemInitializers: 'bulkEditForm:configureFields',
  BulkEditFormActionInitializers: 'bulkEditForm:configureActions',
  AuditLogsTableColumnInitializers: 'auditLogsTable:configureColumns',
  AuditLogsTableActionColumnInitializers: 'auditLogsTable:configureItemActions',
  AuditLogsTableActionInitializers: 'auditLogsTable:configureActions',
  SnapshotBlockInitializers: 'popup:snapshot:addBlock',
  AddBlockButton: 'workflowManual:popup:configureUserInterface:addBlock',
  AddCustomFormField: 'workflowManual:customForm:configureFields',
  AddActionButton: 'workflowManual:form:configureActions',
};

/**
 * 由于旧版的 schema 的 x-initializer 的值是旧的命名风格，当其与新的命名比较时就存在问题，
 * 这里通过将新版命名转换为旧版命名再进行比较，已解决这个问题。
 * @param oldOrNewName x-initializer 的值
 * @param newName 新的命名
 */
export function isInitializersSame(oldOrNewName: string, newName: string) {
  return oldOrNewName === newName || oldToNewNameMap[oldOrNewName] === newName;
}
