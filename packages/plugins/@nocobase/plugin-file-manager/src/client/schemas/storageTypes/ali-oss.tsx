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
  title: `{{t("Aliyun OSS", { ns: "${NAMESPACE}" })}}`,
  name: 'ali-oss',
  fieldset: {
    title: common.title,
    name: common.name,
    baseUrl: common.baseUrl,
    options: {
      type: 'object',
      'x-component': 'fieldset',
      properties: {
        region: {
          title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          description: `{{t('Aliyun OSS region part of the bucket. For example: "oss-cn-beijing".', { ns: "${NAMESPACE}" })}}`,
          required: true,
        },
        accessKeyId: {
          title: `{{t("AccessKey ID", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          required: true,
        },
        accessKeySecret: {
          title: `{{t("AccessKey Secret", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': { password: true },
          required: true,
        },
        bucket: {
          title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          required: true,
        },
        timeout: {
          title: `{{t("Timeout", { ns: "${NAMESPACE}" })}}`,
          description: `{{t('Upload timeout for a single file in milliseconds. Default is 600000.', { ns: "${NAMESPACE}" })}}`,
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          default: 600_000,
        },
        thumbnailRule: {
          title: 'Thumbnail rule',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'TextAreaWithGlobalScope',
          'x-component-props': {
            placeholder: '?x-oss-process=image/auto-orient,1/resize,m_fill,w_94,h_94/quality,q_90',
          },
          description: '{{ renderThumbnailRuleDesc("ali-oss") }}',
        },
      },
    },
    path: common.path,
    rules: common.rules,
    default: common.default,
    paranoid: common.paranoid,
  },
  thumbnailRuleLink: 'https://help.aliyun.com/zh/oss/user-guide/resize-images-4',
};
