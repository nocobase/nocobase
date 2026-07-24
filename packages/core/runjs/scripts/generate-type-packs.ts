/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import { generateRunJSTypeLibraryPacks, RunJSTypePackArtifactsOutOfDateError } from '../src/type-packs/generator';
import { runJSTypeLibraryPackDefinitions } from './type-pack-definitions';

export interface RunJSTypePackGeneratorCliIO {
  error(message: string): void;
  log(message: string): void;
}

export async function runTypePackGeneratorCli(
  args: readonly string[],
  options: {
    projectRoot?: string;
    outputDirectory?: string;
    io?: RunJSTypePackGeneratorCliIO;
  } = {},
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
      path.join(projectRoot, 'packages/core/client-v2/src/flow/components/code-editor/type-packs/generated'),
  );
  const check = args.includes('--check');

  try {
    const result = await generateRunJSTypeLibraryPacks({
      projectRoot,
      outputDirectory,
      definitions: runJSTypeLibraryPackDefinitions,
      check,
    });
    io.log(
      check
        ? `RunJS type-pack artifacts are current (${result.packs.size} packs).`
        : `Generated ${result.packs.size} RunJS type packs.`,
    );
    return 0;
  } catch (error) {
    if (error instanceof RunJSTypePackArtifactsOutOfDateError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  }
}

if (require.main === module) {
  runTypePackGeneratorCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
