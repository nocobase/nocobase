import * as initializerComponents from './components';
import * as items from './items';
export { useCurrentSchema } from './utils';
export * from './buttons';
export * from './items';
export {
  createFilterFormBlockSchema,
  createFormBlockSchema,
  createReadPrettyFormBlockSchema,
  createTableBlockSchema,
  gridRowColWrap,
  itemsMerge,
  useCollectionDataSourceItemsV2,
  useAssociatedTableColumnInitializerFields,
  useCollectionDataSourceItems,
  useInheritsTableColumnInitializerFields,
  useRecordCollectionDataSourceItems,
  useTableColumnInitializerFields,
} from './utils';

import { Plugin } from '../application/Plugin';
import {
  bulkEditFormItemInitializers,
  calendarActionInitializers,
  calendarFormActionInitializers,
  createFormBlockInitializers,
  createFormBulkEditBlockInitializers,
  cusomeizeCreateFormBlockInitializers,
  customFormItemInitializers,
  filterFormActionInitializers,
  createFormActionInitializers,
  updateFormActionInitializers,
  bulkEditFormActionInitializers,
  ganttActionInitializers,
  filterFormItemInitializers,
  gridCardActionInitializers,
  gridCardItemActionInitializers,
  kanbanActionInitializers,
  listActionInitializers,
  listItemActionInitializers,
  recordBlockInitializers,
  recordFormBlockInitializers,
  subTableActionInitializers,
  tableSelectorInitializers,
  tabPaneInitializers,
  tabPaneInitializersForRecordBlock,
  tabPaneInitializersForBulkEditFormBlock,
  blockInitializers,
  tableActionColumnInitializers,
  tableActionInitializers,
  tableColumnInitializers,
  formItemInitializers,
  formActionInitializers,
  readPrettyFormItemInitializers,
  detailsActionInitializers,
  readPrettyFormActionInitializers,
} from './buttons';

export class SchemaInitializerPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      ...initializerComponents,
      ...items,
    } as any);

    this.app.schemaInitializerManager.add(blockInitializers);
    this.app.schemaInitializerManager.add(tableActionInitializers);
    this.app.schemaInitializerManager.add(tableColumnInitializers);
    this.app.schemaInitializerManager.add(tableActionColumnInitializers);
    this.app.schemaInitializerManager.add(formItemInitializers);
    this.app.schemaInitializerManager.add(formActionInitializers);
    this.app.schemaInitializerManager.add(detailsActionInitializers);
    this.app.schemaInitializerManager.add(readPrettyFormItemInitializers);
    this.app.schemaInitializerManager.add(readPrettyFormActionInitializers);
    this.app.schemaInitializerManager.add(bulkEditFormItemInitializers);
    this.app.schemaInitializerManager.add(calendarActionInitializers);
    this.app.schemaInitializerManager.add(calendarFormActionInitializers);
    this.app.schemaInitializerManager.add(createFormBlockInitializers);
    this.app.schemaInitializerManager.add(createFormBulkEditBlockInitializers);
    this.app.schemaInitializerManager.add(cusomeizeCreateFormBlockInitializers);
    this.app.schemaInitializerManager.add(customFormItemInitializers);
    this.app.schemaInitializerManager.add(filterFormActionInitializers);
    this.app.schemaInitializerManager.add(createFormActionInitializers);
    this.app.schemaInitializerManager.add(updateFormActionInitializers);
    this.app.schemaInitializerManager.add(bulkEditFormActionInitializers);
    this.app.schemaInitializerManager.add(ganttActionInitializers);
    this.app.schemaInitializerManager.add(filterFormItemInitializers);
    this.app.schemaInitializerManager.add(gridCardActionInitializers);
    this.app.schemaInitializerManager.add(gridCardItemActionInitializers);
    this.app.schemaInitializerManager.add(kanbanActionInitializers);
    this.app.schemaInitializerManager.add(listActionInitializers);
    this.app.schemaInitializerManager.add(listItemActionInitializers);
    this.app.schemaInitializerManager.add(recordBlockInitializers);
    this.app.schemaInitializerManager.add(recordFormBlockInitializers);
    this.app.schemaInitializerManager.add(subTableActionInitializers);
    this.app.schemaInitializerManager.add(tableSelectorInitializers);
    this.app.schemaInitializerManager.add(tabPaneInitializers);
    this.app.schemaInitializerManager.add(tabPaneInitializersForRecordBlock);
    this.app.schemaInitializerManager.add(tabPaneInitializersForBulkEditFormBlock);
  }
}
