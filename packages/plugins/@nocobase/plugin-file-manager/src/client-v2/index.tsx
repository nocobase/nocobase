/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default } from './plugin';
export { default as PluginFileManagerClientV2 } from './plugin';
// Storage type definition consumed by `fileManagerPlugin.registerStorageType()`.
// Third-party / commercial plugins (e.g. S3 Pro) call:
//   fileManagerPlugin.registerStorageType('s3-compatible', {
//     title: 'S3 Pro',
//     formLoader: () => import('./S3CompatibleStorageForm'),
//     defaultValues: { ... },
//     upload, createUploadCustomRequest,  // optional runtime overrides
//   });
export type { StorageType } from './plugin';

// Reusable form items for plugins that ship their own storage form. Sharing
// these from the file-manager surface keeps label / extra / validation rules
// consistent across built-in and third-party storage types.
export {
  BaseUrlField,
  DefaultField,
  FileSizeField,
  MimetypeField,
  NameField,
  ParanoidField,
  PathField,
  RenameModeField,
  TitleField,
} from './components';
export type { DefaultFieldProps } from './components/DefaultField';
export type { PathFieldProps } from './components/PathField';
export { CardUpload, UploadFieldModel } from './models/UploadFieldModel';
export { AttachmentFieldInterface } from './interfaces/attachment';

// Preview registry consumed by file-previewer plugins (e.g. plugin-file-previewer-office)
// to add custom preview handlers under v2 without going through the v1 `@nocobase/plugin-file-manager/client` entry.
export { filePreviewTypes, wrapWithModalPreviewer } from './previewer/filePreviewTypes';
export type { FilePreviewType, FilePreviewerProps } from './previewer/filePreviewTypes';
