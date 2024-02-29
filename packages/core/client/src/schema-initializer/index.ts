import { Plugin } from '../application/Plugin';
import { formActionInitializers } from '../modules/blocks/data-blocks/form/formActionInitializers';
import { createFormActionInitializers } from '../modules/blocks/data-blocks/form/createFormActionInitializers';
import { formItemInitializers } from '../modules/blocks/data-blocks/form/formItemInitializers';
import { updateFormActionInitializers } from '../modules/blocks/data-blocks/form/updateFormActionInitializers';
import { tableActionColumnInitializers } from '../modules/blocks/data-blocks/table/TableActionColumnInitializers';
import { tableActionInitializers } from '../modules/blocks/data-blocks/table/TableActionInitializers';
import { tableColumnInitializers } from '../modules/blocks/data-blocks/table/TableColumnInitializers';
import {
  blockInitializers,
  createFormBlockInitializers,
  cusomeizeCreateFormBlockInitializers,
  customFormItemInitializers,
  detailsActionInitializers,
  filterFormActionInitializers,
  filterFormItemInitializers,
  gridCardActionInitializers,
  gridCardItemActionInitializers,
  listActionInitializers,
  listItemActionInitializers,
  readPrettyFormActionInitializers,
  readPrettyFormItemInitializers,
  recordBlockInitializers,
  recordFormBlockInitializers,
  subTableActionInitializers,
  tabPaneInitializers,
  tabPaneInitializersForBulkEditFormBlock,
  tabPaneInitializersForRecordBlock,
  tableSelectorInitializers,
} from './buttons';
import * as initializerComponents from './components';
import * as items from './items';
import { CreateFormBlockInitializer } from '../modules/blocks/data-blocks/form/CreateFormBlockInitializer';
import { FormBlockInitializer } from '../modules/blocks/data-blocks/form/FormBlockInitializer';
import { RecordFormBlockInitializer } from '../modules/blocks/data-blocks/form/RecordFormBlockInitializer';
import { TableBlockInitializer } from '../modules/blocks/data-blocks/table/TableBlockInitializer';
import { TableSelectorInitializer } from '../modules/blocks/data-blocks/table-selector/TableSelectorInitializer';
import { RecordReadPrettyFormBlockInitializer } from '../modules/blocks/data-blocks/details-single/RecordReadPrettyFormBlockInitializer';
export * from './buttons';
export * from './items';
export {
  createFilterFormBlockSchema,
  createFormBlockSchema,
  createReadPrettyFormBlockSchema,
  createTableBlockSchema,
  gridRowColWrap,
  itemsMerge,
  useAssociatedFormItemInitializerFields,
  useAssociatedTableColumnInitializerFields,
  useCollectionDataSourceItems,
  useCurrentSchema,
  useFormItemInitializerFields,
  useInheritsTableColumnInitializerFields,
  useRecordCollectionDataSourceItems,
  useRemoveGridFormItem,
  useTableColumnInitializerFields,
} from './utils';

export class SchemaInitializerPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      ...initializerComponents,
      ...items,
      CreateFormBlockInitializer,
      FormBlockInitializer,
      RecordFormBlockInitializer,
      TableBlockInitializer,
      TableSelectorInitializer,
      RecordReadPrettyFormBlockInitializer,
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
    this.app.schemaInitializerManager.add(createFormBlockInitializers);
    this.app.schemaInitializerManager.add(cusomeizeCreateFormBlockInitializers);
    this.app.schemaInitializerManager.add(customFormItemInitializers);
    this.app.schemaInitializerManager.add(filterFormActionInitializers);
    this.app.schemaInitializerManager.add(createFormActionInitializers);
    this.app.schemaInitializerManager.add(updateFormActionInitializers);
    this.app.schemaInitializerManager.add(filterFormItemInitializers);
    this.app.schemaInitializerManager.add(gridCardActionInitializers);
    this.app.schemaInitializerManager.add(gridCardItemActionInitializers);

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
