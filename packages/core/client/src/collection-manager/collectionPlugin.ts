/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';

import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
import {
  CheckboxFieldInterface,
  CheckboxGroupFieldInterface,
  CollectionSelectFieldInterface,
  ColorFieldInterface,
  CreatedAtFieldInterface,
  CreatedByFieldInterface,
  DateFieldInterface,
  DatetimeFieldInterface,
  DatetimeNoTzFieldInterface,
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
  NanoidFieldInterface,
  NumberFieldInterface,
  O2MFieldInterface,
  O2OFieldInterface,
  OBOFieldInterface,
  OHOFieldInterface,
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
  UnixTimestampFieldInterface,
  UpdatedAtFieldInterface,
  UpdatedByFieldInterface,
  UrlFieldInterface,
  UUIDFieldInterface,
} from './interfaces';
import {
  GeneralCollectionTemplate,
  SqlCollectionTemplate,
  TreeCollectionTemplate,
  ViewCollectionTemplate,
} from './templates';
import { DEFAULT_DATA_SOURCE_KEY, DEFAULT_DATA_SOURCE_TITLE } from '../data-source/data-source/DataSourceManager';
import { DataSource } from '../data-source/data-source/DataSource';

class MainDataSource extends DataSource {
  async getDataSource() {
    const service = await this.app.apiClient.request({
      resource: 'collections',
      action: 'listMeta',
    });

    const collections = service?.data?.data || [];

    return {
      collections,
    };
  }
}

export class CollectionPlugin extends Plugin {
  async load() {
    this.dataSourceManager.addCollectionMixins([InheritanceCollectionMixin]);
    this.addFieldInterfaces();
    this.addCollectionTemplates();
    this.addFieldInterfaces();
    this.addFieldInterfaceGroups();
    this.addMainDataSource();
  }

  addMainDataSource() {
    if (this.options?.config?.enableRemoteDataSource === false) return;
    this.dataSourceManager.addDataSource(MainDataSource, {
      key: DEFAULT_DATA_SOURCE_KEY,
      displayName: DEFAULT_DATA_SOURCE_TITLE,
    });
  }

  addFieldInterfaceGroups() {
    this.dataSourceManager.addFieldInterfaceGroups({
      basic: {
        label: '{{t("Basic")}}',
        order: 1,
      },
      choices: {
        label: '{{t("Choices")}}',
        order: 20,
      },
      media: {
        label: '{{t("Media")}}',
        order: 40,
      },
      datetime: {
        label: '{{t("Date & Time")}}',
        order: 80,
      },
      relation: {
        label: '{{t("Relation")}}',
        order: 100,
      },
      advanced: {
        label: '{{t("Advanced type")}}',
        order: 200,
      },
      systemInfo: {
        label: '{{t("System info")}}',
        order: 400,
      },
      others: {
        label: '{{t("Others")}}',
        order: 800,
      },
    });
  }

  addFieldInterfaces() {
    this.dataSourceManager.addFieldInterfaces([
      CheckboxFieldInterface,
      CheckboxGroupFieldInterface,
      CollectionSelectFieldInterface,
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
      UUIDFieldInterface,
      NanoidFieldInterface,
      UnixTimestampFieldInterface,
      DateFieldInterface,
      DatetimeNoTzFieldInterface,
    ]);
  }

  addCollectionTemplates() {
    this.dataSourceManager.addCollectionTemplates([
      GeneralCollectionTemplate,
      SqlCollectionTemplate,
      TreeCollectionTemplate,
      ViewCollectionTemplate,
    ]);
  }
}
