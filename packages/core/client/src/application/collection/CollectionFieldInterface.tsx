import { cloneDeep, merge } from 'lodash';
import { ISchema } from '@formily/react';
import { CollectionFieldOptionsV2 } from './Collection';
import { MenuProps } from 'antd';

export interface CollectionFieldInterfaceOptions extends ISchema {
  name: string;
  description?: string;
  group: string;
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
  schemaInitialize?: (schema: ISchema, data: any) => void;
  validateSchema?: (fieldSchema: ISchema) => Record<string, ISchema>;
  usePathOptions?: (field: CollectionFieldOptionsV2) => any;
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
  [key: string]: any;
}
export class CollectionFieldInterfaceV2 {
  protected options: CollectionFieldInterfaceOptions;

  constructor(options: CollectionFieldInterfaceOptions) {
    this.options = options;
  }

  get name() {
    return this.options.name;
  }

  get group() {
    return this.options.group;
  }

  get title() {
    return this.options.title;
  }

  get description() {
    return this.options.description;
  }

  get default() {
    return this.options.default;
  }

  get sortable() {
    return this.options.sortable;
  }

  get filterable() {
    return this.options.filterable;
  }

  get titleUsable() {
    return this.options.titleUsable;
  }

  get availableTypes() {
    return this.options.availableTypes;
  }

  get hasDefaultValue() {
    return this.options.hasDefaultValue;
  }

  get isAssociation() {
    return this.options.isAssociation;
  }

  get schemaInitialize() {
    return this.options.schemaInitialize;
  }

  get validateSchema() {
    return this.options.validateSchema;
  }

  get usePathOptions() {
    return this.options.usePathOptions;
  }

  getOption<K extends keyof CollectionFieldInterfaceOptions>(key: K): CollectionFieldInterfaceOptions[K] {
    return this.options[key];
  }

  getOptions(): CollectionFieldInterfaceOptions {
    return cloneDeep(this.options);
  }

  setOptions(options: CollectionFieldInterfaceOptions) {
    merge(this.options, options);
  }
}
