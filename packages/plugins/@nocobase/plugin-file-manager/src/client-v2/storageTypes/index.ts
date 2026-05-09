/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FILE_SIZE_LIMIT_DEFAULT,
  STORAGE_TYPE_ALI_OSS,
  STORAGE_TYPE_LOCAL,
  STORAGE_TYPE_S3,
  STORAGE_TYPE_TX_COS,
} from '../../constants';
import type { StorageFieldMeta, StorageTypeMeta } from './types';

function defineField(field: StorageFieldMeta): StorageFieldMeta {
  return field;
}

const commonFields = {
  title: defineField({
    name: 'title',
    label: 'Title',
    component: 'input',
    required: true,
  }),
  name: defineField({
    name: 'name',
    label: 'Storage name',
    component: 'input',
    required: true,
    description:
      'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
  }),
  baseUrl: defineField({
    name: 'baseUrl',
    label: 'Base URL',
    component: 'variableInput',
    required: true,
    description: 'Base URL for file access, could be your CDN base URL. For example: "https://cdn.nocobase.com".',
  }),
  path: defineField({
    name: 'path',
    label: 'Path',
    component: 'variableInput',
    description:
      'Relative path the file will be saved to. Left blank as root path. The leading and trailing slashes "/" will be ignored. For example: "user/avatar".',
  }),
  renameMode: defineField({
    name: 'renameMode',
    label: 'Renaming',
    component: 'radio',
    defaultValue: 'appendRandomID',
    description: 'Renaming strategy to avoid filename conflicts when uploading files.',
  }),
  rulesSize: defineField({
    name: ['rules', 'size'],
    label: 'File size limit',
    component: 'number',
    required: true,
    defaultValue: FILE_SIZE_LIMIT_DEFAULT,
    description: 'Minimum from 1 byte.',
  }),
  rulesMimetype: defineField({
    name: ['rules', 'mimetype'],
    label: 'File type allowed (in MIME type format)',
    component: 'input',
    placeholder: '*',
    description:
      'Multi-types seperated with comma, for example: "image/*", "image/png", "image/*, application/pdf" etc.',
  }),
  default: defineField({
    name: 'default',
    label: 'Default storage',
    component: 'checkbox',
  }),
  paranoid: defineField({
    name: 'paranoid',
    label: 'Keep file in storage when destroy the file record',
    component: 'checkbox',
    description:
      'Files are only removed when their corresponding records in the file collection are deleted. If a record from another collection includes an associating field referencing the file collection, the file will not be deleted unless cascade deletion is enabled for that association.',
  }),
};

export const storageTypes: Record<string, StorageTypeMeta> = {
  [STORAGE_TYPE_LOCAL]: {
    name: STORAGE_TYPE_LOCAL,
    title: 'Local storage',
    fields: [
      commonFields.title,
      commonFields.name,
      { ...commonFields.baseUrl, hidden: true, defaultValue: '/storage/uploads' },
      {
        name: ['options', 'documentRoot'],
        label: 'Destination',
        component: 'input',
        hidden: true,
        defaultValue: 'storage/uploads',
      },
      { ...commonFields.path, addonBefore: 'storage/uploads/' },
      commonFields.renameMode,
      commonFields.rulesSize,
      commonFields.rulesMimetype,
      commonFields.default,
      commonFields.paranoid,
    ],
  },
  [STORAGE_TYPE_ALI_OSS]: {
    name: STORAGE_TYPE_ALI_OSS,
    title: 'Aliyun OSS',
    thumbnailRuleLink: 'https://help.aliyun.com/zh/oss/user-guide/resize-images-4',
    fields: [
      commonFields.title,
      commonFields.name,
      commonFields.baseUrl,
      {
        name: ['options', 'region'],
        label: 'Region',
        component: 'variableInput',
        required: true,
        description: 'Aliyun OSS region part of the bucket. For example: "oss-cn-beijing".',
      },
      { name: ['options', 'accessKeyId'], label: 'AccessKey ID', component: 'variableInput', required: true },
      {
        name: ['options', 'accessKeySecret'],
        label: 'AccessKey Secret',
        component: 'passwordVariableInput',
        required: true,
      },
      { name: ['options', 'bucket'], label: 'Bucket', component: 'variableInput', required: true },
      {
        name: ['options', 'timeout'],
        label: 'Timeout',
        component: 'number',
        defaultValue: 600_000,
        description: 'Upload timeout for a single file in milliseconds. Default is 600000.',
      },
      {
        name: ['options', 'thumbnailRule'],
        label: 'File pre-process parameters',
        component: 'variableInput',
        placeholder: '?x-oss-process=image/auto-orient,1/resize,m_fill,w_94,h_94/quality,q_90',
      },
      commonFields.path,
      commonFields.renameMode,
      commonFields.rulesSize,
      commonFields.rulesMimetype,
      commonFields.default,
      commonFields.paranoid,
      {
        name: ['settings', 'requestOptions'],
        label: 'Request options',
        component: 'json',
        defaultValue: {},
        description:
          'Additional options for HTTP requests when fetching files from remote storage on server side, such as headers.',
      },
    ],
  },
  [STORAGE_TYPE_S3]: {
    name: STORAGE_TYPE_S3,
    title: 'Amazon S3',
    fields: [
      commonFields.title,
      commonFields.name,
      commonFields.baseUrl,
      { name: ['options', 'region'], label: 'Region', component: 'variableInput', required: true },
      { name: ['options', 'accessKeyId'], label: 'AccessKey ID', component: 'variableInput', required: true },
      {
        name: ['options', 'secretAccessKey'],
        label: 'AccessKey Secret',
        component: 'passwordVariableInput',
        required: true,
      },
      { name: ['options', 'bucket'], label: 'Bucket', component: 'variableInput', required: true },
      { name: ['options', 'endpoint'], label: 'Endpoint', component: 'variableInput' },
      commonFields.path,
      commonFields.renameMode,
      commonFields.rulesSize,
      commonFields.rulesMimetype,
      commonFields.default,
      commonFields.paranoid,
    ],
  },
  [STORAGE_TYPE_TX_COS]: {
    name: STORAGE_TYPE_TX_COS,
    title: 'Tencent COS',
    thumbnailRuleLink: 'https://cloud.tencent.com/document/product/436/42214',
    fields: [
      commonFields.title,
      commonFields.name,
      commonFields.baseUrl,
      { name: ['options', 'Region'], label: 'Region', component: 'variableInput', required: true },
      { name: ['options', 'SecretId'], label: 'SecretId', component: 'variableInput', required: true },
      { name: ['options', 'SecretKey'], label: 'SecretKey', component: 'passwordVariableInput', required: true },
      { name: ['options', 'Bucket'], label: 'Bucket', component: 'variableInput', required: true },
      {
        name: ['options', 'thumbnailRule'],
        label: 'Thumbnail rule',
        component: 'variableInput',
        placeholder: '?imageMogr2/thumbnail/!50p',
      },
      commonFields.path,
      commonFields.renameMode,
      commonFields.rulesSize,
      commonFields.rulesMimetype,
      commonFields.default,
      commonFields.paranoid,
    ],
  },
};
