/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getRunJSRuntimeHost, type RunJSRuntimeHost } from './RunJSRuntimeHost';

export const createRunJSRuntimeContext: RunJSRuntimeHost['createRuntimeContext'] = (...args) =>
  getRunJSRuntimeHost().createRuntimeContext(...args);

export const evaluateResolvedRunJSValue: RunJSRuntimeHost['evaluateResolvedValue'] = (...args) =>
  getRunJSRuntimeHost().evaluateResolvedValue(...args);

export const evaluateInlineRunJSValue: RunJSRuntimeHost['evaluateInlineValue'] = (...args) =>
  getRunJSRuntimeHost().evaluateInlineValue(...args);

export const getRunJSModelUse: RunJSRuntimeHost['getModelUse'] = (...args) =>
  getRunJSRuntimeHost().getModelUse(...args);
