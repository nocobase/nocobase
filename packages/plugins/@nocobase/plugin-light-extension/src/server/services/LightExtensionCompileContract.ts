/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSurfaceStyle } from '@nocobase/runjs';

import type { LightExtensionKind } from '../../constants';

export type LightExtensionSurfaceStyle = 'render' | 'value' | 'action';

export interface LightExtensionAuthoringSurfaceSpec {
  kind: LightExtensionKind;
  surfaceStyle: LightExtensionSurfaceStyle;
  compilerSurfaceStyle: Exclude<RunJSSurfaceStyle, 'workflow'>;
  modelUse: string;
  surface: string;
}

export const LIGHT_EXTENSION_AUTHORING_SURFACES: Record<LightExtensionKind, LightExtensionAuthoringSurfaceSpec> = {
  'js-block': {
    kind: 'js-block',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSBlockModel',
    surface: 'js-model.render',
  },
  'js-field': {
    kind: 'js-field',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSEditableFieldModel',
    surface: 'js-model.render',
  },
  'js-action': {
    kind: 'js-action',
    surfaceStyle: 'action',
    compilerSurfaceStyle: 'action',
    modelUse: 'JSActionModel',
    surface: 'js-model.action',
  },
  'js-item': {
    kind: 'js-item',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSItemActionModel',
    surface: 'js-model.render',
  },
  runjs: {
    kind: 'runjs',
    surfaceStyle: 'value',
    compilerSurfaceStyle: 'value',
    modelUse: 'RunJSValue',
    surface: 'runjs.value',
  },
};
