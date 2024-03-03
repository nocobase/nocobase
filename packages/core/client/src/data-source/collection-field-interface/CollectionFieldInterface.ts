import type { ISchema } from '@formily/react';
import type { CollectionFieldOptions } from '../collection';
import { CollectionFieldInterfaceManager } from './CollectionFieldInterfaceManager';

export type CollectionFieldInterfaceFactory = new (
  collectionFieldInterfaceManager: CollectionFieldInterfaceManager,
) => CollectionFieldInterface;

export abstract class CollectionFieldInterface {
  constructor(public collectionFieldInterfaceManager: CollectionFieldInterfaceManager) {}
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
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  hasDefaultValue?: boolean;
  isAssociation?: boolean;
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
  titleUsable?: boolean;
  validateSchema?(fieldSchema: ISchema): Record<string, ISchema>;
  usePathOptions?(field: CollectionFieldOptions): any;
  schemaInitialize?(schema: ISchema, data: any): void;
}
