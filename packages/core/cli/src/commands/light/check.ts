/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JsTemplateCheck from '../js-template/check.js';
import { LEGACY_LIGHT_EXTENSION_WORKSPACE_API_PATHS } from '../../lib/js-template-command-contract.js';

/** Legacy `nb light check` facade. */
export default class LightCheck extends JsTemplateCheck {
  protected override apiPaths = LEGACY_LIGHT_EXTENSION_WORKSPACE_API_PATHS;
}
