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
  title: `{{t("MinIO 对象存储", { ns: "${NAMESPACE}" })}}`,
  name: 'minio',
  fieldset: {
    title: common.title,
    name: common.name,
    baseUrl: common.baseUrl,
    options: {
      type: 'object',
      'x-component': 'fieldset',
      properties: {
        endpoint: {
          title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            placeholder: 'http://localhost:9000',
          },
          required: true,
          description: `{{t("MinIO server endpoint (e.g., http://localhost:9000)", { ns: "${NAMESPACE}" })}}`,
        },
        region: {
          title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            placeholder: 'us-east-1',
          },
          default: 'us-east-1',
          description: `{{t("MinIO region (default: us-east-1)", { ns: "${NAMESPACE}" })}}`,
        },
        accessKeyId: {
          type: 'string',
          title: `{{t("AccessKey", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            placeholder: '请输入 AccessKey',
          },
          required: true,
          description: `{{t("MinIO AccessKey for authentication", { ns: "${NAMESPACE}" })}}`,
        },
        secretAccessKey: {
          type: 'string',
          title: `{{t("SecretKey", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            password: true,
            placeholder: '请输入 SecretKey',
          },
          required: true,
          description: `{{t("MinIO SecretKey for authentication", { ns: "${NAMESPACE}" })}}`,
        },
        bucket: {
          title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            placeholder: 'nocobase',
          },
          required: true,
          description: `{{t("MinIO bucket name for file storage", { ns: "${NAMESPACE}" })}}`,
        },
      },
    },
    path: common.path,
    rules: common.rules,
    default: common.default,
    paranoid: common.paranoid,
  },
};
