/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField } from '@formily/react';
import { defaultProps, operators } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class UrlFieldInterface extends CollectionFieldInterface {
  name = 'url';
  type = 'string';
  group = 'basic';
  order = 5;
  title = '{{t("URL")}}';
  default = {
    type: 'text',
    uiSchema: {
      type: 'string',
      'x-component': 'Input.URL',
    },
  };
  componentOptions = [
    {
      label: 'URL',
      value: 'Input.URL',
    },
    {
      label: 'Preview',
      value: 'Input.Preview',
      useVisible: () => {
        const field = useField();
        return !field.editable;
      },
    },
    {
      label: 'Upload',
      value: 'Upload.Attachment',
      useVisible: () => {
        const field = useField();
        return field.editable;
      },
      useProps: () => {
        return {
          targetValue: 'url',
          action: `attachments:create`,
        };
      },
    },
  ];
  availableTypes = ['string', 'text'];
  schemaInitialize(schema: ISchema, { block }) {}
  properties = {
    ...defaultProps,
  };
  titleUsable = true;
  filterable = {
    operators: operators.string,
  };
}
