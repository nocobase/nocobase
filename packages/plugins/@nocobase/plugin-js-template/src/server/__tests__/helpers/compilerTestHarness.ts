/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from '@nocobase/runjs/server';

import {
  JS_TEMPLATE_AUTHORING_SURFACES,
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  type JsTemplateCompileJob,
} from '../../services/JsTemplateCompileContract';
import { buildJsTemplateCompileKey } from '../../services/JsTemplateCompileKey';

export function createCompileJob(ordinal: number): JsTemplateCompileJob {
  const templateName = `template-${ordinal}`;
  const entryPath = `src/client/js-blocks/${templateName}/index.tsx`;
  const content = `ctx.render(<div>${ordinal}</div>);\n`;
  const files = [
    {
      path: entryPath,
      content,
      blobHash: sha256Hex(content),
      language: 'tsx',
      mode: '100644',
    },
  ];
  const key = buildJsTemplateCompileKey({
    template: {
      target: 'client',
      kind: 'js-block',
      entryPath,
      descriptorPath: `src/client/js-blocks/${templateName}/entry.json`,
    },
    files,
  });
  return {
    jobId: `job-${ordinal}`,
    requestId: `request-${ordinal}`,
    correlationId: 'batch-1',
    projectId: 'project-1',
    templateId: `template-id-${ordinal}`,
    templateName,
    ordinal,
    compileKey: key.compileKey,
    filesHash: key.filesHash,
    kind: 'js-block',
    entryPath,
    runtimeVersion: 'v2',
    surface: structuredClone(JS_TEMPLATE_AUTHORING_SURFACES['js-block']),
    compilerBuildIdentity: structuredClone(JS_TEMPLATE_COMPILER_BUILD_IDENTITY),
    inputManifest: key.inputManifest,
    files,
  };
}
