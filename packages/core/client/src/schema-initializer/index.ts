export * from './buttons';
export * from './items';
export * from './SchemaInitializer';
export * from './SchemaInitializerProvider';
export * from './types';
export {
  createFilterFormBlockSchema,
  createFormBlockSchema,
  createTableBlockSchema,
  gridRowColWrap,
  itemsMerge,
  useAssociatedTableColumnInitializerFields,
  useCollectionDataSourceItems,
  useInheritsTableColumnInitializerFields,
  useRecordCollectionDataSourceItems,
  useTableColumnInitializerFields,
} from './utils';

import { Plugin } from '../application/Plugin';
import { SchemaInitializerProvider } from './SchemaInitializerProvider';
import { blockInitializerV2, tableActionInitializersV2, tableColumnInitializer } from './buttons';

export class SchemaInitializerPlugin<SchemaInitializerProviderProps> extends Plugin {
  async load() {
    this.app.use<SchemaInitializerProviderProps>(SchemaInitializerProvider, this.options?.config);

    this.app.schemaInitializerManager.add('BlockInitializers', blockInitializerV2);
    this.app.schemaInitializerManager.add('TableActionInitializers', tableActionInitializersV2);
    this.app.schemaInitializerManager.add('TableColumnInitializers', tableColumnInitializer);
  }
}
