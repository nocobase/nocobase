/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  buildCompilePerformanceAcceptanceReport,
  serializeCompilePerformanceAcceptanceJson,
  serializeCompilePerformanceAcceptanceMarkdown,
  type CompilePerformanceAcceptanceReportInput,
} from './compilePerformanceAcceptanceReport';

interface ReportGeneratorArguments {
  inputPath: string;
  outputPrefix: string;
}

export async function generateCompilePerformanceAcceptanceReportFiles(
  inputPath: string,
  outputPrefix: string,
): Promise<{ jsonPath: string; markdownPath: string }> {
  const input = JSON.parse(await readFile(inputPath, 'utf8')) as CompilePerformanceAcceptanceReportInput;
  const report = buildCompilePerformanceAcceptanceReport(input);
  const jsonPath = `${outputPrefix}.json`;
  const markdownPath = `${outputPrefix}.md`;
  await writeFile(jsonPath, serializeCompilePerformanceAcceptanceJson(report), 'utf8');
  await writeFile(markdownPath, serializeCompilePerformanceAcceptanceMarkdown(report), 'utf8');
  return { jsonPath, markdownPath };
}

async function main(): Promise<void> {
  const { inputPath, outputPrefix } = parseArguments(process.argv.slice(2));
  const result = await generateCompilePerformanceAcceptanceReportFiles(inputPath, outputPrefix);
  process.stdout.write(`${result.jsonPath}\n${result.markdownPath}\n`);
}

function parseArguments(argv: string[]): ReportGeneratorArguments {
  const inputPath = readArgument(argv, '--input');
  const outputPrefix = readArgument(argv, '--output-prefix');
  if (!inputPath || !outputPrefix) {
    throw new Error('Usage: --input <benchmark-input.json> --output-prefix <report-path-without-extension>');
  }
  return { inputPath: resolve(inputPath), outputPrefix: resolve(outputPrefix) };
}

function readArgument(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
