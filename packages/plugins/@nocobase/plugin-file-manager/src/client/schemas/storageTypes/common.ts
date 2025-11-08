/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FILE_SIZE_LIMIT_DEFAULT } from '../../../constants';
import { NAMESPACE } from '../../locale';

export default {
  title: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  name: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-disabled': '{{ !createOnly }}',
    required: true,
    default: '{{ useNewId("s_") }}',
    description:
      '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
  },
  baseUrl: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    description: `{{t('Base URL for file access, could be your CDN base URL. For example: "https://cdn.nocobase.com".', { ns: "${NAMESPACE}" })}}`,
  },
  path: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    description: `{{t('Relative path the file will be saved to. Left blank as root path. The leading and trailing slashes "/" will be ignored. For example: "user/avatar".', { ns: "${NAMESPACE}" })}}`,
  },
  rules: {
    type: 'object',
    'x-component': 'fieldset',
    properties: {
      size: {
        type: 'number',
        title: `{{t("File size limit", { ns: "${NAMESPACE}" })}}`,
        description: `{{t("Minimum from 1 byte.", { ns: "${NAMESPACE}" })}}`,
        'x-decorator': 'FormItem',
        'x-component': 'FileSizeField',
        required: true,
        default: FILE_SIZE_LIMIT_DEFAULT,
      },
      mimetype: {
        type: 'string',
        title: `{{t("File type (in MIME type format)", { ns: "${NAMESPACE}" })}}`,
        description: `{{t('Multi-types seperated with comma, for example: "image/*", "image/png", "image/*, application/pdf" etc.', { ns: "${NAMESPACE}" })}}`,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: '*',
        },
      },
    },
  },
  default: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-content': `{{t("Default storage", { ns: "${NAMESPACE}" })}}`,
  },
  paranoid: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-content': `{{t("Keep file in storage when destroy the file record", { ns: "${NAMESPACE}" })}}`,
    description: `{{t("Files are only removed when their corresponding records in the file collection are deleted. If a record from another collection includes an associating field referencing the file collection, the file will not be deleted unless cascade deletion is enabled for that association.", { ns: "${NAMESPACE}" })}}`,
  },
};
