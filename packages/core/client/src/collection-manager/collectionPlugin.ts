/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';

import { name } from 'packages/core/database/src/__tests__/fixtures/collections/tags';
import { DataSource } from '../data-source/data-source/DataSource';
import { DEFAULT_DATA_SOURCE_KEY, DEFAULT_DATA_SOURCE_TITLE } from '../data-source/data-source/DataSourceManager';
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
import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
import {
  GeneralCollectionTemplate,
  SqlCollectionTemplate,
  TreeCollectionTemplate,
  ViewCollectionTemplate,
} from './templates';

class MainDataSource extends DataSource {
  async getDataSource() {
    const service = await this.app.apiClient.request({
      resource: 'collections',
      action: 'listMeta',
    });

    const collections = service?.data?.data || [];

    return {
      key: 'main',
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
