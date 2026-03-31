/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fg from 'fast-glob';
import path from 'path';
import ts from 'typescript';

import { ROOT_PATH } from './constant';

const INCLUDE_PATTERNS = ['**/*.{ts,tsx}'];
const EXCLUDE_PATTERNS = [
  '**/fixtures{,/**}',
  '**/demos{,/**}',
  '**/__test__{,/**}',
  '**/__tests__{,/**}',
  '**/__benchmarks__{,/**}',
  '**/__e2e__{,/**}',
  '**/*.mdx',
  '**/*.md',
  '**/*.+(test|e2e|spec).+(js|jsx|ts|tsx)',
  '**/tsconfig{,.*}.json',
  '.umi{,-production,-test}{,/**}',
];

const diagnosticHost: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: () => process.cwd(),
  getCanonicalFileName: (fileName) => (ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()),
  getNewLine: () => ts.sys.newLine,
};

function loadCompilerOptions(): ts.CompilerOptions {
  const configPath = path.join(ROOT_PATH, 'tsconfig.json');
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext([configFile.error], diagnosticHost));
  }
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath,
  );
  const options: ts.CompilerOptions = {
    ...parsedConfig.options,
  };
  delete options.paths;
  return options;
}

export const buildDeclaration = async (cwd: string, targetDir: string) => {
  const srcPath = path.join(cwd, 'src');
  const targetPath = path.join(cwd, targetDir);
  const files = await fg(INCLUDE_PATTERNS, {
    cwd: srcPath,
    ignore: EXCLUDE_PATTERNS,
    absolute: true,
    dot: true,
  });

  if (!files.length) {
    return;
  }

  const compilerOptions = {
    ...loadCompilerOptions(),
    declaration: true,
    emitDeclarationOnly: true,
    declarationDir: targetPath,
    outDir: targetPath,
    rootDir: srcPath,
  } satisfies ts.CompilerOptions;

  const program = ts.createProgram(files, compilerOptions);
  const emitResult = program.emit(undefined, undefined, undefined, true);
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  if (diagnostics.length) {
    const details = ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticHost);
    throw new Error(`Failed to build declarations for ${cwd} \n${details}`);
  }
};
