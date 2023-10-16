export * from './buttons';
export * from './items';
export * from './SchemaInitializer';
export * from './SchemaInitializerProvider';
export * from './types';
export {
  createFilterFormBlockSchema,
  createFormBlockSchema,
  createReadPrettyFormBlockSchema,
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

export class SchemaInitializerPlugin<SchemaInitializerProviderProps> extends Plugin {
  async load() {
    this.app.use<SchemaInitializerProviderProps>(SchemaInitializerProvider, this.options?.config);
  }
}
