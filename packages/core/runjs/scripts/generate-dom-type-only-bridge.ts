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
  generateRunJSDOMTypeOnlyBridge,
  RunJSDOMTypeOnlyBridgeOutOfDateError,
} from '../src/dom-type-only-bridge/generator';

export interface RunJSDOMTypeOnlyBridgeCliIO {
  error(message: string): void;
  log(message: string): void;
}

export async function runDomTypeOnlyBridgeGeneratorCli(
  args: readonly string[],
  options: { outputPath?: string; io?: RunJSDOMTypeOnlyBridgeCliIO } = {},
): Promise<number> {
  const unknownArguments = args.filter((argument) => argument !== '--check');
  const io = options.io || console;
  if (unknownArguments.length) {
    io.error(`Unknown arguments: ${unknownArguments.join(', ')}`);
    return 1;
  }

  const outputPath = path.resolve(
    options.outputPath || path.resolve(__dirname, '../src/generated/dom-type-only-bridge.ts'),
  );
  const check = args.includes('--check');

  try {
    const declaration = await generateRunJSDOMTypeOnlyBridge({ outputPath, check });
    io.log(
      check
        ? `RunJS DOM type-only bridge is current (${declaration.length} bytes).`
        : `Generated RunJS DOM type-only bridge (${declaration.length} bytes).`,
    );
    return 0;
  } catch (error) {
    if (error instanceof RunJSDOMTypeOnlyBridgeOutOfDateError) {
      io.error(error.message);
      return 1;
    }
    throw error;
  }
}

if (require.main === module) {
  runDomTypeOnlyBridgeGeneratorCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
