import { Plugin } from '../application/Plugin';

import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
import {
  CheckboxFieldInterface,
  CheckboxGroupFieldInterface,
  ChinaRegionFieldInterface,
  CollectionFieldInterface,
  ColorFieldInterface,
  CreatedAtFieldInterface,
  CreatedByFieldInterface,
  DatetimeFieldInterface,
  EmailFieldInterface,
  IconFieldInterface,
  IdFieldInterface,
  InputFieldInterface,
  IntegerFieldInterface,
  JsonFieldInterface,
  LinkToFieldInterface,
  M2MFieldInterface,
  M2OFieldInterface,
  MarkdownFieldInterface,
  MultipleSelectFieldInterface,
  NumberFieldInterface,
  O2MFieldInterface,
  O2OFieldInterface,
  OHOFieldInterface,
  OBOFieldInterface,
  PasswordFieldInterface,
  PercentFieldInterface,
  PhoneFieldInterface,
  RadioGroupFieldInterface,
  RichTextFieldInterface,
  SelectFieldInterface,
  SubTableFieldInterface,
  TableoidFieldInterface,
  TextareaFieldInterface,
  TimeFieldInterface,
  UpdatedAtFieldInterface,
  UpdatedByFieldInterface,
  UrlFieldInterface,
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
      CheckboxFieldInterface,
      CheckboxGroupFieldInterface,
      ChinaRegionFieldInterface,
      CollectionFieldInterface,
      ColorFieldInterface,
      CreatedAtFieldInterface,
      CreatedByFieldInterface,
      DatetimeFieldInterface,
      EmailFieldInterface,
      IconFieldInterface,
      IdFieldInterface,
      InputFieldInterface,
      IntegerFieldInterface,
      JsonFieldInterface,
      LinkToFieldInterface,
      M2MFieldInterface,
      M2OFieldInterface,
      MarkdownFieldInterface,
      MultipleSelectFieldInterface,
      NumberFieldInterface,
      O2MFieldInterface,
      O2OFieldInterface,
      OHOFieldInterface,
      OBOFieldInterface,
      PasswordFieldInterface,
      PercentFieldInterface,
      PhoneFieldInterface,
      RadioGroupFieldInterface,
      RichTextFieldInterface,
      SelectFieldInterface,
      SubTableFieldInterface,
      TableoidFieldInterface,
      TextareaFieldInterface,
      TimeFieldInterface,
      UpdatedAtFieldInterface,
      UpdatedByFieldInterface,
      UrlFieldInterface,
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
