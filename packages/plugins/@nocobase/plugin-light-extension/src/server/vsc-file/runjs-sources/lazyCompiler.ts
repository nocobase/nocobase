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
} from '@nocobase/runjs/compiler';
import { createRequire } from 'node:module';

import type { RunJSCompileDiagnostic } from '../../../shared/vsc-file/runjs-source-types';

export type * from '@nocobase/runjs/compiler';

type RunJSCompilerModule = typeof import('@nocobase/runjs/compiler');
const requireCompiler = createRequire(__filename);

function getCompiler(): RunJSCompilerModule {
  return requireCompiler('@nocobase/runjs/compiler') as RunJSCompilerModule;
}

export async function compileRunJSSourceWorkspace(
  input: CompileRunJSSourceWorkspaceInput,
): Promise<CompileRunJSSourceWorkspaceResult> {
  return getCompiler().compileRunJSSourceWorkspace(input);
}

export function inspectRunJSSourceCode(input: InspectRunJSSourceCodeInput): RunJSCompileDiagnostic[] {
  return getCompiler().inspectRunJSSourceCode(input);
}
