/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CompileRunJSSourceWorkspaceInput,
  CompileRunJSSourceWorkspaceResult,
  InspectRunJSSourceCodeInput,
} from '../../../compiler';
import {
  inspectRunJSSourceCode as inspectRunJSSourceCodeWithCompiler,
  loadRunJSCompiler,
} from '../../../compiler/loader';

import type { RunJSCompileDiagnostic } from '../../shared/runjs-source-types';

export type * from '../../../compiler';

export async function compileRunJSSourceWorkspace(
  input: CompileRunJSSourceWorkspaceInput,
): Promise<CompileRunJSSourceWorkspaceResult> {
  return (await loadRunJSCompiler()).compileRunJSSourceWorkspace(input);
}

export function inspectRunJSSourceCode(input: InspectRunJSSourceCodeInput): RunJSCompileDiagnostic[] {
  return inspectRunJSSourceCodeWithCompiler(input);
}
