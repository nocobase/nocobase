import type { ISchema } from '@formily/react';
import type { CollectionFieldOptionsV3 } from '../collection';
import type { IField } from '../../../collection-manager';
import type { Application } from '../../Application';
import type { DataSourceManagerV3 } from '../data-source';

export type CollectionFieldInterfaceFactory = new (
  app: Application,
  dataSourceManager: DataSourceManagerV3,
) => CollectionFieldInterfaceV3;

export abstract class CollectionFieldInterfaceV3 implements IField {
  constructor(
    public app: Application,
    public dataSourceManager: DataSourceManagerV3,
  ) {}
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
  abstract validateSchema(fieldSchema: ISchema): Record<string, ISchema>;
  abstract usePathOptions(field: CollectionFieldOptionsV3): any;
  abstract schemaInitialize(schema: ISchema, data: any): void;
}
