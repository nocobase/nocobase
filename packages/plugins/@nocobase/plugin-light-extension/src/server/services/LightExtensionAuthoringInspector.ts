/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { inspectRunJsAuthoringCode } from '@nocobase/plugin-flow-engine';
import type {
  RunJSCompileDiagnostic,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSurfaceStyle,
} from '@nocobase/plugin-vsc-file';

import type { LightExtensionKind } from '../../constants';

export type LightExtensionSurfaceStyle = 'render' | 'value' | 'action' | 'run' | 'event';

export interface LightExtensionAuthoringSurfaceSpec {
  kind: LightExtensionKind;
  surfaceStyle: LightExtensionSurfaceStyle;
  enabled: boolean;
  compilerSurfaceStyle?: Exclude<RunJSSurfaceStyle, 'workflow'>;
  modelUse?: string;
  surface?: string;
}

export interface LightExtensionAuthoringInspectionInput {
  code: string;
  path: string;
  kind: LightExtensionKind;
  surfaceStyle: LightExtensionSurfaceStyle;
}

type FlowSurfaceAuthoringError = {
  message: string;
  path?: string;
  ruleId?: string;
  index?: unknown;
  details?: unknown;
};

export const LIGHT_EXTENSION_AUTHORING_SURFACES: Record<LightExtensionKind, LightExtensionAuthoringSurfaceSpec> = {
  'js-block': {
    kind: 'js-block',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSBlockModel',
    surface: 'js-model.render',
    enabled: true,
  },
  'js-field': {
    kind: 'js-field',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSEditableFieldModel',
    surface: 'js-model.render',
    enabled: true,
  },
  'js-action': {
    kind: 'js-action',
    surfaceStyle: 'action',
    compilerSurfaceStyle: 'action',
    modelUse: 'JSActionModel',
    surface: 'js-model.action',
    enabled: true,
  },
  'js-item': {
    kind: 'js-item',
    surfaceStyle: 'render',
    compilerSurfaceStyle: 'render',
    modelUse: 'JSItemActionModel',
    surface: 'js-model.render',
    enabled: true,
  },
  runjs: {
    kind: 'runjs',
    surfaceStyle: 'run',
    compilerSurfaceStyle: 'value',
    modelUse: 'JSItemModel',
    surface: 'reaction.value-runjs',
    enabled: true,
  },
  event: {
    kind: 'event',
    surfaceStyle: 'event',
    enabled: false,
  },
};

export class LightExtensionAuthoringInspector {
  inspect(input: LightExtensionAuthoringInspectionInput): RunJSCompileDiagnostic[] {
    const spec = LIGHT_EXTENSION_AUTHORING_SURFACES[input.kind];
    if (!spec || !spec.compilerSurfaceStyle || !spec.modelUse || !spec.surface) {
      return [];
    }

    return inspectRunJsAuthoringCode({
      code: input.code,
      path: input.path,
      modelUse: spec.modelUse,
      surface: spec.surface,
      surfaceStyle: spec.compilerSurfaceStyle,
    }).map((error) => flowSurfaceErrorToRunJSDiagnostic(input.path, input.code, error));
  }

  createRunJSSourceInspector(): RunJSSourceAuthoringInspector {
    return (input: RunJSSourceAuthoringInspectionInput) => {
      const kind = readLightExtensionKind(input.legacy?.metadata?.kind);
      if (!kind || input.surfaceStyle === 'workflow') {
        return [];
      }

      return this.inspect({
        code: input.code,
        path: input.path,
        kind,
        surfaceStyle: input.surfaceStyle,
      });
    };
  }
}

function flowSurfaceErrorToRunJSDiagnostic(
  fallbackPath: string,
  source: string,
  error: FlowSurfaceAuthoringError,
): RunJSCompileDiagnostic {
  return {
    severity: 'error',
    code: 'RUNJS_COMPILE_FAILED',
    ruleId: error.ruleId,
    path: error.path || fallbackPath,
    ...locationFromIndex(source, error.index),
    message: error.message,
    details: toUnknownRecord(error.details),
  };
}

function locationFromIndex(source: string, index: unknown): Pick<RunJSCompileDiagnostic, 'line' | 'column'> {
  if (typeof index !== 'number' || !Number.isFinite(index) || index < 0) {
    return {};
  }

  const before = source.slice(0, index).replace(/\r\n?/g, '\n');
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function toUnknownRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function readLightExtensionKind(value: unknown): LightExtensionKind | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value in LIGHT_EXTENSION_AUTHORING_SURFACES ? (value as LightExtensionKind) : null;
}
