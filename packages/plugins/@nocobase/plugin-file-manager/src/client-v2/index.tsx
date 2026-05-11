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
export type { StorageTypeRuntime } from './plugin';

// Storage form extension surface: third-party / commercial plugins (e.g.
// S3 Pro) call `storageFormRegistry.register(...)` to contribute additional
// storage types into the file-manager settings page.
export { storageFormRegistry } from './storage-forms';
export type { StorageFormDefinition } from './storage-forms';

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
