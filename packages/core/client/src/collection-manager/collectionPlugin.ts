import { Plugin } from '../application/Plugin';

import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
import {
  checkbox,
  checkboxGroup,
  chinaRegion,
  collection,
  color,
  createdAt,
  createdBy,
  datetime,
  email,
  icon,
  id,
  input,
  integer,
  json,
  linkTo,
  m2m,
  m2o,
  markdown,
  multipleSelect,
  number,
  o2m,
  o2o,
  password,
  percent,
  phone,
  radioGroup,
  richText,
  select,
  subTable,
  tableoid,
  textarea,
  time,
  updatedAt,
  updatedBy,
  url,
} from './interfaces';
import {
  GeneralCollectionTemplate,
  ExpressionCollectionTemplate,
  SqlCollectionTemplate,
  TreeCollectionTemplate,
  ViewCollectionTemplate,
} from './templates';
import { collection as collectionData } from './Configuration/schemas/collections';

export class CollectionPlugin extends Plugin {
  async load() {
    this.collectionManager.addCollectionMixins([InheritanceCollectionMixin]);
    this.addFieldInterfaces();
    this.addCollectionTemplates();
    this.addFieldInterfaces();

    this.collectionManager.setReloadFn(this.reloadCollections.bind(this));
  }

  addFieldGroups() {
    this.collectionManager.addFieldGroups({
      basic: {
        label: '{{t("Basic")}}',
      },
      choices: {
        label: '{{t("Choices")}}',
      },
      media: {
        label: '{{t("Media")}}',
      },
      datetime: {
        label: '{{t("Date & Time")}}',
      },
      relation: {
        label: '{{t("Relation")}}',
      },
      advanced: {
        label: '{{t("Advanced type")}}',
      },
      systemInfo: {
        label: '{{t("System info")}}',
      },
      others: {
        label: '{{t("Others")}}',
      },
    });
  }

  addFieldInterfaces() {
    this.app.collectionManager.addFieldInterfaces([
      checkbox,
      checkboxGroup,
      chinaRegion,
      collection,
      color,
      createdAt,
      createdBy,
      datetime,
      email,
      icon,
      id,
      input,
      integer,
      json,
      linkTo,
      m2m,
      m2o,
      markdown,
      multipleSelect,
      number,
      o2m,
      o2o,
      password,
      percent,
      phone,
      radioGroup,
      richText,
      select,
      subTable,
      tableoid,
      textarea,
      time,
      updatedAt,
      updatedBy,
      url,
    ]);
  }

  addCollectionTemplates() {
    this.app.collectionManager.addCollectionTemplates([
      GeneralCollectionTemplate,
      ExpressionCollectionTemplate,
      SqlCollectionTemplate,
      TreeCollectionTemplate,
      ViewCollectionTemplate,
    ]);
  }

  async reloadCollections() {
    const service = await this.app.apiClient.request<{
      data: any;
    }>({
      resource: 'collections',
      action: 'list',
      params: {
        paginate: false,
        appends: ['fields', 'category'],
        filter: {
          // inherit: false,
        },
        sort: ['sort'],
      },
    });

    return [...(service?.data?.data || []), collectionData];
  }
}
