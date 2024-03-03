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
  recordBlockInitializers,
  recordFormBlockInitializers,
  subTableActionInitializers,
  tabPaneInitializers,
  tabPaneInitializersForBulkEditFormBlock,
  tabPaneInitializersForRecordBlock,
} from './buttons';
import * as initializerComponents from './components';
import * as items from './items';
import { CreateFormBlockInitializer } from '../modules/blocks/data-blocks/form/CreateFormBlockInitializer';
import { FormBlockInitializer } from '../modules/blocks/data-blocks/form/FormBlockInitializer';
import { RecordFormBlockInitializer } from '../modules/blocks/data-blocks/form/RecordFormBlockInitializer';
import { TableBlockInitializer } from '../modules/blocks/data-blocks/table/TableBlockInitializer';
import { TableSelectorInitializer } from '../modules/blocks/data-blocks/table-selector/TableSelectorInitializer';
import { RecordReadPrettyFormBlockInitializer } from '../modules/blocks/data-blocks/details-single/RecordReadPrettyFormBlockInitializer';
import { readPrettyFormActionInitializers } from '../modules/blocks/data-blocks/details-single/ReadPrettyFormActionInitializers';
import { readPrettyFormItemInitializers } from '../modules/blocks/data-blocks/details-single/ReadPrettyFormItemInitializers';
import { DetailsBlockInitializer } from '../modules/blocks/data-blocks/details-multi/DetailsBlockInitializer';
import { detailsActionInitializers } from '../modules/blocks/data-blocks/details-multi/DetailsActionInitializers';
import { ListBlockInitializer } from '../modules/blocks/data-blocks/list/ListBlockInitializer';
import { listActionInitializers } from '../modules/blocks/data-blocks/list/ListActionInitializers';
import { listItemActionInitializers } from '../modules/blocks/data-blocks/list/listItemActionInitializers';
import { GridCardBlockInitializer } from '../modules/blocks/data-blocks/grid-card/GridCardBlockInitializer';
import { gridCardActionInitializers } from '../modules/blocks/data-blocks/grid-card/GridCardActionInitializers';
import { gridCardItemActionInitializers } from '../modules/blocks/data-blocks/grid-card/gridCardItemActionInitializers';
import { FilterFormBlockInitializer } from '../modules/blocks/filter-blocks/form/FilterFormBlockInitializer';
import { filterFormActionInitializers } from '../modules/blocks/filter-blocks/form/FilterFormActionInitializers';
import { filterFormItemInitializers } from '../modules/blocks/filter-blocks/form/filterFormItemInitializers';
import { FilterCollapseBlockInitializer } from '../modules/blocks/filter-blocks/collapse/FilterCollapseBlockInitializer';
import { MarkdownBlockInitializer } from '../modules/blocks/other-blocks/markdown/MarkdownBlockInitializer';
import { MarkdownFormItemInitializer } from '../modules/blocks/other-blocks/markdown/MarkdownFormItemInitializer';
import { TableCollectionFieldInitializer } from '../modules/fields/initializer/TableCollectionFieldInitializer';
import { CollectionFieldInitializer } from '../modules/fields/initializer/CollectionFieldInitializer';
import { tableSelectorInitializers } from '../modules/fields/component/Picker/TableSelectorInitializers';
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
      DetailsBlockInitializer,
      ListBlockInitializer,
      GridCardBlockInitializer,
      FilterFormBlockInitializer,
      FilterCollapseBlockInitializer,
      MarkdownBlockInitializer,
      MarkdownFormItemInitializer,
      TableCollectionFieldInitializer,
      CollectionFieldInitializer,
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
