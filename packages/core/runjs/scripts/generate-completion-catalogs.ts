/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import {
  generateRunJSCompletionCatalogs,
  RunJSCompletionCatalogArtifactsOutOfDateError,
} from '../src/completion-catalog/generator';
import { runJSCompletionCatalogDefinitions } from './completion-catalog-definitions';

export interface RunJSCompletionCatalogCliIO {
  error(message: string): void;
  log(message: string): void;
}

export async function runCompletionCatalogGeneratorCli(
  args: readonly string[],
  options: { projectRoot?: string; outputDirectory?: string; io?: RunJSCompletionCatalogCliIO } = {},
): Promise<number> {
  const unknownArguments = args.filter((argument) => argument !== '--check');
  const io = options.io || console;
  if (unknownArguments.length) {
    io.error(`Unknown arguments: ${unknownArguments.join(', ')}`);
    return 1;
  }
  const projectRoot = path.resolve(options.projectRoot || path.resolve(__dirname, '../../../..'));
  const outputDirectory = path.resolve(
    options.outputDirectory ||
      path.join(projectRoot, 'packages/core/client-v2/src/flow/components/code-editor/completion-catalogs/generated'),
  );
  const check = args.includes('--check');
  try {
    const result = await generateRunJSCompletionCatalogs({
      projectRoot,
      outputDirectory,
      definitions: runJSCompletionCatalogDefinitions,
      check,
    });
    io.log(
      check
        ? `RunJS completion catalogs are current (${result.catalogs.size} catalogs).`
        : `Generated ${result.catalogs.size} RunJS completion catalogs.`,
    );
    return 0;
  } catch (error) {
    if (error instanceof RunJSCompletionCatalogArtifactsOutOfDateError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  }
}

if (require.main === module) {
  runCompletionCatalogGeneratorCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
