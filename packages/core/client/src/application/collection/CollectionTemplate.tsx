import { cloneDeep, omit, merge } from 'lodash';
import { CollectionOptionsV2, CollectionV2 } from './Collection';
import { ISchema } from '@formily/react';

export interface CollectionTemplateOptionsV2 {
  name: string;
  Collection?: typeof CollectionV2;
  transform?: (collection: CollectionV2) => void;
  title?: string;
  color?: string;
  /** 排序 */
  order?: number;
  /** 默认配置 */
  default?: CollectionOptions;
  events?: any;
  /** UI 可配置的 CollectionOptions 参数（添加或编辑的 Collection 表单的字段） */
  configurableProperties?: Record<string, ISchema>;
  /** 当前模板可用的字段类型 */
  availableFieldInterfaces?: AvailableFieldInterfacesInclude | AvailableFieldInterfacesExclude;
  /** 是否分割线 */
  divider?: boolean;
  /** 模板描述 */
  description?: string;
  /**配置字段中的操作按钮 */
  configureActions?: Record<string, ISchema>;
  //是否禁止删除字段
  forbidDeletion?: boolean;
}

interface AvailableFieldInterfacesInclude {
  include?: any[];
}

interface AvailableFieldInterfacesExclude {
  exclude?: any[];
}

interface CollectionOptions {
  /**
   * 自动生成 id
   * @default true
   * */
  autoGenId?: boolean;
  /** 创建人 */
  createdBy?: boolean;
  /** 最后更新人 */
  updatedBy?: boolean;
  /** 创建日期 */
  createdAt?: boolean;
  /** 更新日期 */
  updatedAt?: boolean;
  /** 可排序 */
  sortable?: boolean;
  /* 树结构 */
  tree?: string;
  /* 日志 */
  logging?: boolean;
  /** 继承 */
  inherits?: string | string[];
  /* 字段列表 */
  fields?: CollectionOptionsV2['fields'];
  [key: string]: any;
}

export class CollectionTemplateV2 {
  protected options: CollectionTemplateOptionsV2;

  constructor(options: CollectionTemplateOptionsV2) {
    this.options = options;
  }

  get name() {
    return this.options.name;
  }

  get title() {
    return this.options.title;
  }

  get Collection() {
    return this.options.Collection;
  }

  get transform() {
    return this.options.transform;
  }

  get configureActions() {
    return this.options.configureActions;
  }

  get forbidDeletion() {
    return this.options.forbidDeletion;
  }

  get default() {
    return this.options.default;
  }

  get events() {
    return this.options.events;
  }

  get availableFieldInterfaces() {
    return this.options.availableFieldInterfaces;
  }

  get configurableProperties() {
    return this.options.configurableProperties;
  }

  get description() {
    return this.options.description;
  }

  get order() {
    return this.options.order;
  }

  get color() {
    return this.options.color;
  }

  get divider() {
    return this.options.divider;
  }

  getOption<K extends keyof CollectionTemplateOptionsV2>(key: K): CollectionTemplateOptionsV2[K] {
    return this.options[key];
  }

  getOptions(): CollectionTemplateOptionsV2 {
    return {
      ...cloneDeep(omit(this.options, 'Collection')),
      Collection: this.options.Collection,
    };
  }

  setOptions(options: CollectionTemplateOptionsV2) {
    merge(this.options, options);
  }
}
