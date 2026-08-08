/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSCompileDiagnostic, RunJSSurfaceStyle } from './contracts';

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
