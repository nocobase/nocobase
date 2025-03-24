/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../../locale';
import common from './common';

export default {
  title: `{{t("Local storage", { ns: "${NAMESPACE}" })}}`,
  name: 'local',
  fieldset: {
    title: common.title,
    name: common.name,
    baseUrl: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-display': 'hidden',
      default: '/storage/uploads',
    },
    options: {
      type: 'object',
      'x-component': 'div',
      properties: {
        documentRoot: {
          title: `{{t("Destination", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-display': 'hidden',
          default: 'storage/uploads',
        },
      },
    },
    path: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-component-props': {
        addonBefore: 'storage/uploads/',
      },
    },
    rules: common.rules,
    default: common.default,
    paranoid: common.paranoid,
  },
};
