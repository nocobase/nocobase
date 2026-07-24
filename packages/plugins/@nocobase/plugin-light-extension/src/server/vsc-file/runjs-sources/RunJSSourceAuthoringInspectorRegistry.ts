/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSCompileDiagnostic,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
} from '../../../shared/vsc-file/runjs-source-types';

export class RunJSSourceAuthoringInspectorRegistry {
  private readonly inspectors = new Set<RunJSSourceAuthoringInspector>();

  register(inspector: RunJSSourceAuthoringInspector): () => void {
    this.inspectors.add(inspector);

    return () => {
      this.inspectors.delete(inspector);
    };
  }

  inspect(input: RunJSSourceAuthoringInspectionInput): RunJSCompileDiagnostic[] {
    return Array.from(this.inspectors).flatMap((inspector) => inspector(input));
  }
}
