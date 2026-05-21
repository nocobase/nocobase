/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  SnowflakeIdFieldInterface,
  SubTableFieldInterface,
  TableoidFieldInterface,
  TextareaFieldInterface,
  TimeFieldInterface,
  UnixTimestampFieldInterface,
  UpdatedAtFieldInterface,
  UpdatedByFieldInterface,
  UrlFieldInterface,
  UUIDFieldInterface,
  Plugin,
} from '@nocobase/client-v2';

const MAIN_DATA_SOURCE_KEY = 'main';
const MAIN_DATA_SOURCE_TITLE = '{{t("Main")}}';

const fieldInterfaceGroups = {
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
};

const fieldInterfaces = [
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
  SnowflakeIdFieldInterface,
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
];

export class CollectionPluginV2 extends Plugin {
  async beforeLoad() {
    this.app.dataSourceManager.upsertDataSource({
      key: MAIN_DATA_SOURCE_KEY,
      displayName: MAIN_DATA_SOURCE_TITLE,
    });
    this.app.dataSourceManager.addFieldInterfaces(fieldInterfaces);
    this.app.dataSourceManager.addFieldInterfaceGroups(fieldInterfaceGroups);
    this.app.dataSourceManager.registerLoader(MAIN_DATA_SOURCE_KEY, async ({ manager }) => {
      const requester = manager.requester || this.app.apiClient.request.bind(this.app.apiClient);
      const service = await requester({
        resource: 'collections',
        action: 'listMeta',
      });
      const collections = service?.data?.data || [];
      return { collections };
    });
  }
}
