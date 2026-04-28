/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { defaultDockerRegistryForLang } from './source/download.js';
export type {
  DownloadCommandResult,
  DownloadParsedFlags,
  DownloadResolvedFlags,
} from './source/download.js';
import SourceDownload from './source/download.js';

export default class Download extends SourceDownload {
  static override hidden = true;
}
