/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createFormRegistry } from '@nocobase/client-v2';
import type React from 'react';

export interface StorageFormDefinition {
  /**
   * Server-side storage type identifier (e.g. `local`, `s3`, `ali-oss`).
   * Must match the `type` value persisted in the `storages` collection so
   * existing records resolve back to the right form on edit.
   */
  name: string;
  /**
   * Display title used in the "Add new" dropdown and in the drawer header.
   * Pass a raw (non-translated) string; the page wraps it with `t(...)`.
   */
  title: string;
  /**
   * Synchronous form component. Renders the body of the storage drawer —
   * i.e. the list of `<Form.Item>` fields. The wrapping `<Form>`, drawer
   * header, footer, submit logic, and `initialValues` injection are owned
   * by `FileStoragePage`, so each storage implementation only needs to
   * declare its fields.
   *
   * Mutually exclusive with `formLoader`. Prefer `formLoader` for large
   * forms that should be code-split.
   */
  Form?: React.ComponentType;
  /**
   * Async form loader for code-splitting large or rarely-used storage
   * forms. The loaded module's default export is used as the form
   * component, matching the convention of `componentLoader` and
   * `registerModelLoaders` elsewhere in the codebase.
   *
   * Mutually exclusive with `Form`.
   *
   * @example
   * formLoader: () => import('./S3CompatibleStorageForm'),
   */
  formLoader?: () => Promise<{ default: React.ComponentType }>;
  /**
   * Optional per-storage initial values, merged on top of the page-level
   * defaults (`type` + generated `name`) when creating a new record. Useful
   * for storages that ship sensible defaults outside of `Form.Item`
   * `initialValue` (e.g. `local` writes `baseUrl` / `documentRoot` defaults).
   */
  defaultValues?: Record<string, any>;
}

export const storageFormRegistry = createFormRegistry<StorageFormDefinition>('file-manager:storages');
