import { ISchema } from '@formily/react';
import { CollectionFieldOptionsV2 } from './Collection';
import { IField } from '../../collection-manager';
import { Application } from '../Application';
import { CollectionManagerV2 } from './CollectionManager';

export class CollectionFieldInterface implements IField {
  app: Application;
  collectionManager: CollectionManagerV2;
  constructor(app: Application, collectionManager: CollectionManagerV2) {
    this.app = app;
    this.collectionManager = collectionManager;
  }
  name: string;
  group: string;
  title?: string;
  description?: string;
  order?: number;
  default?: {
    type: string;
    uiSchema?: ISchema;
    [key: string]: any;
  };
  sortable?: boolean;
  availableTypes?: string[];
  hasDefaultValue?: boolean;
  isAssociation?: boolean;
  validateSchema(fieldSchema: ISchema): Record<string, ISchema> {
    return null as any;
  }
  usePathOptions(field: CollectionFieldOptionsV2): any {}
  operators?: any[];
  /**
   * - 如果该值为空，则在 Filter 组件中该字段会被过滤掉
   * - 如果该值为空，则不会在变量列表中看到该字段
   */
  filterable?: {
    /**
     * 字段所支持的操作符，会在 Filter 组件中显示，比如设置 `数据范围` 的时候可以看见
     */
    operators?: any[];
    /**
     * 为当前字段添加子选项，这个子选项会在 Filter 组件中显示，比如设置 `数据范围` 的时候可以看见
     */
    children?: any[];
    [key: string]: any;
  };
  // NOTE: set to `true` means field could be used as a title field
  titleUsable?: boolean;
  schemaInitialize(schema: ISchema, data: any): void {}
}
