/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface IPluginData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  displayName: string;
  packageName: string;
  version: string;
  enabled: boolean;
  removable?: boolean;
  installed: boolean;
  builtIn: boolean;
  registry?: string;
  authToken?: string;
  compressedFileUrl?: string;
  options: Record<string, unknown>;
  description?: string;
  type: 'npm' | 'upload' | 'url';
  isCompatible?: boolean;
  readmeUrl: string;
  changelogUrl: string;
  error: boolean;
  updatable?: boolean;
  homepage?: string;
  keywords?: string[];
}
