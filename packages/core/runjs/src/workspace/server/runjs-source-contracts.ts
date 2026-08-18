/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stableSerialize, type RunJSCompileDiagnostic, type RunJSSurfaceStyle } from '../../index';
import { sha256Hex } from '../../server';
import type { RunJSSourceLocator } from '../shared';

export function buildRunJSOwnerFingerprint(input: {
  locator: RunJSSourceLocator;
  ownerUpdatedAt?: unknown;
  selectedLegacyValue: unknown;
  selectedVersion: unknown;
}): string {
  return sha256Hex(
    stableSerialize({
      locator: input.locator,
      ownerUpdatedAt: input.ownerUpdatedAt ?? null,
      selectedLegacyValue: input.selectedLegacyValue ?? null,
      selectedVersion: input.selectedVersion ?? null,
    }),
  );
}

export type RunJSSourceErrorCode =
  | 'PERMISSION_DENIED'
  | 'RUNJS_SOURCE_KIND_UNSUPPORTED'
  | 'RUNJS_SOURCE_LOCATOR_INVALID'
  | 'RUNJS_SOURCE_NOT_FOUND'
  | 'RUNJS_SOURCE_READONLY'
  | 'RUNJS_SOURCE_OWNER_OUTDATED'
  | 'INTERNAL_ERROR';

export interface RunJSSourceErrorOptions {
  details?: Record<string, unknown>;
  status?: number;
}

const defaultStatusByCode: Record<RunJSSourceErrorCode, number> = {
  PERMISSION_DENIED: 403,
  RUNJS_SOURCE_KIND_UNSUPPORTED: 400,
  RUNJS_SOURCE_LOCATOR_INVALID: 400,
  RUNJS_SOURCE_NOT_FOUND: 404,
  RUNJS_SOURCE_READONLY: 403,
  RUNJS_SOURCE_OWNER_OUTDATED: 409,
  INTERNAL_ERROR: 500,
};

export class RunJSSourceError extends Error {
  readonly status: number;

  readonly details?: Record<string, unknown>;

  constructor(
    readonly code: RunJSSourceErrorCode,
    message?: string,
    options: RunJSSourceErrorOptions = {},
  ) {
    super(message || code);
    this.name = 'RunJSSourceError';
    this.status = options.status || defaultStatusByCode[code];
    this.details = options.details;
  }

  toResponseBody() {
    return {
      errors: [
        {
          code: this.code,
          message: this.message,
          status: this.status,
          details: this.details,
        },
      ],
    };
  }
}

export interface RunJSSourceCodeInspectionInput {
  code: string;
  path: string;
  surfaceStyle: RunJSSurfaceStyle;
  additionalAllowedGlobals?: Iterable<string>;
}

export type RunJSSourceCodeInspector = (input: RunJSSourceCodeInspectionInput) => RunJSCompileDiagnostic[];

export class RunJSSourceCodeInspectorRegistry {
  private readonly inspectors = new Map<RunJSSourceCodeInspector, number>();

  register(inspector: RunJSSourceCodeInspector): () => void {
    this.inspectors.set(inspector, (this.inspectors.get(inspector) || 0) + 1);
    let registered = true;
    return () => {
      if (!registered) {
        return;
      }
      registered = false;
      const registrations = this.inspectors.get(inspector) || 0;
      if (registrations <= 1) {
        this.inspectors.delete(inspector);
        return;
      }
      this.inspectors.set(inspector, registrations - 1);
    };
  }

  inspect(input: RunJSSourceCodeInspectionInput): RunJSCompileDiagnostic[] {
    return Array.from(this.inspectors.keys()).flatMap((inspector) => inspector(input));
  }
}

export const runJSSourceCodeInspectorRegistry = new RunJSSourceCodeInspectorRegistry();
