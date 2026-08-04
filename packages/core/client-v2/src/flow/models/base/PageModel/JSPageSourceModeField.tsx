/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createRunJSSourceModeField, type RunJSSourceModeFieldProps } from '../../../components/runjs-source';

export const JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD = 'JSPageJsTemplateFullSourceField';
export const JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD = 'JSPageJsTemplateSettingsStepField';
export const JS_TEMPLATE_PAGE_FULL_SOURCE_FIELD = JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD;
export const JS_TEMPLATE_PAGE_SETTINGS_STEP_FIELD = JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD;

export type JSPageSourceModeFieldProps = RunJSSourceModeFieldProps;

export const JSPageSourceModeField = createRunJSSourceModeField(JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD);

export default JSPageSourceModeField;
