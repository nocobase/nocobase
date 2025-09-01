/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { NAMESPACE } from '../../locale';

export function getConfigFormCommonFieldset({ variableOptions }) {
  return {
    title: {
      type: 'string',
      required: true,
      title: `{{t("Message title")}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.TextArea',
      'x-component-props': {
        scope: variableOptions,
        useTypedConstant: ['string'],
      },
    },
    content: {
      type: 'string',
      required: true,
      title: `{{t("Message content")}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.RawTextArea',
      'x-component-props': {
        scope: variableOptions,
        placeholder: 'Hi,',
        autoSize: {
          minRows: 10,
        },
      },
    },
    options: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          required: false,
          title: `{{t("Details page for desktop")}}`,
          'x-decorator': 'FormItem',
          'x-component': 'Variable.TextArea',
          'x-component-props': {
            scope: variableOptions,
            useTypedConstant: ['string'],
            delimiters: ['{{{', '}}}'],
          },
          description: tval(
            'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/admin". If using an external link, the link starts with "http", for example, "https://example.com".',
            { ns: NAMESPACE },
          ),
        },
        mobileUrl: {
          type: 'string',
          required: false,
          title: `{{t("Details page for mobile")}}`,
          'x-decorator': 'FormItem',
          'x-component': 'Variable.TextArea',
          'x-component-props': {
            scope: variableOptions,
            useTypedConstant: ['string'],
            delimiters: ['{{{', '}}}'],
          },
          description: tval(
            'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/m". If using an external link, the link starts with "http", for example, "https://example.com".',
            { ns: NAMESPACE },
          ),
        },
        duration: {
          type: 'number',
          title: `{{t("Duration")}}`,
          description: tval('Unit is second. Will not close automatically when set to empty.', { ns: NAMESPACE }),
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          default: 5,
        },
      },
    },
  };
}
