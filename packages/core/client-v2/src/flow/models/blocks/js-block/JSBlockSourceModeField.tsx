/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createRunJSSourceModeField, type RunJSSourceModeFieldProps } from '../../../components/runjs-source';

export const JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD = 'JSBlockLightExtensionFullSourceField';
export const JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD = 'JSBlockLightExtensionSettingsStepField';

export type JSBlockSourceModeFieldProps = RunJSSourceModeFieldProps;

export const JSBlockSourceModeField = createRunJSSourceModeField(JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD);

export default JSBlockSourceModeField;
