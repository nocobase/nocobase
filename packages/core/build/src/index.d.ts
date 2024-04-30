/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */


import { Options as TsupConfig } from 'tsup'
import { InlineConfig as ViteConfig } from 'vite'

export type PkgLog = (msg: string, ...args: any[]) => void;

interface UserConfig {
  modifyTsupConfig?: (config: TsupConfig) => TsupConfig;
  modifyViteConfig?: (config: ViteConfig) => ViteConfig;
  beforeBuild?: (log: PkgLog) => void | Promise<void>;
  afterBuild?: (log: PkgLog) => void | Promise<void>;
}

declare const defineConfig: (config: UserConfig) => UserConfig;
