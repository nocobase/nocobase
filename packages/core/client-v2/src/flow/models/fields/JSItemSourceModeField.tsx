/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createRunJSSourceModeField, type RunJSSourceModeFieldProps } from '../../components/runjs-source';

export const JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD = 'JSItemLightExtensionFullSourceField';
export const JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD = 'JSItemLightExtensionSettingsStepField';

export type JSItemSourceModeFieldProps = RunJSSourceModeFieldProps;

export const JSItemSourceModeField = createRunJSSourceModeField(JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD);

export default JSItemSourceModeField;
