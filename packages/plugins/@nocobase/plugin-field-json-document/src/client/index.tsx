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
  ColorFieldInterface,
  DatetimeFieldInterface,
  EmailFieldInterface,
  IconFieldInterface,
  IdFieldInterface,
  InputFieldInterface,
  IntegerFieldInterface,
  MarkdownFieldInterface,
  MultipleSelectFieldInterface,
  NanoidFieldInterface,
  NumberFieldInterface,
  PasswordFieldInterface,
  PercentFieldInterface,
  PhoneFieldInterface,
  Plugin,
  RadioGroupFieldInterface,
  RichTextFieldInterface,
  SelectFieldInterface,
  TextareaFieldInterface,
  TimeFieldInterface,
  UUIDFieldInterface,
  UnixTimestampFieldInterface,
  UrlFieldInterface,
} from '@nocobase/client';
import { JSONDocArrayInterface, JSONDocObjectInterface } from './interface/JSONDoc';
import { JSONDocFields } from './components/JSONDocFields';
import { FieldInterfaceManager } from './field-interface-manager';

export class PluginFieldJsonDocumentClient extends Plugin {
  fieldInterfaceManager = new FieldInterfaceManager(this.app);

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.fieldInterfaceManager.addFieldInterfaces(
      CheckboxFieldInterface,
      CheckboxGroupFieldInterface,
      ColorFieldInterface,
      DatetimeFieldInterface,
      EmailFieldInterface,
      IconFieldInterface,
      IdFieldInterface,
      InputFieldInterface,
      IntegerFieldInterface,
      MarkdownFieldInterface,
      MultipleSelectFieldInterface,
      NumberFieldInterface,
      PasswordFieldInterface,
      PercentFieldInterface,
      PhoneFieldInterface,
      RadioGroupFieldInterface,
      RichTextFieldInterface,
      SelectFieldInterface,
      TextareaFieldInterface,
      TimeFieldInterface,
      UrlFieldInterface,
      UUIDFieldInterface,
      NanoidFieldInterface,
      UnixTimestampFieldInterface,
    );

    this.app.addComponents({
      JSONDocFields,
    });
    this.app.dataSourceManager.addFieldInterfaces([JSONDocObjectInterface, JSONDocArrayInterface]);
  }
}

export default PluginFieldJsonDocumentClient;
