import fs from 'node:fs/promises';
import path from 'node:path';

import YAML from 'yaml';

import type { PromptCase, PromptSuite } from './types.js';

const suiteFiles = ['prompts.yaml', 'business-prompts.yaml'] as const;

function assertStringArray(
  value: unknown,
  field: string,
): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${field} must be an array of strings.`);
  }
}

function validateCase(value: unknown, file: string): PromptCase {
  if (!value || typeof value !== 'object') {
    throw new Error(`Invalid prompt case in ${file}.`);
  }
  const item = value as Record<string, unknown>;
  for (const field of ['id', 'action', 'risk', 'prompt'] as const) {
    if (typeof item[field] !== 'string' || item[field].length === 0) {
      throw new Error(`${file}: case ${String(item.id)} has invalid ${field}.`);
    }
  }
  assertStringArray(item.expected, `${file}:${String(item.id)}.expected`);
  assertStringArray(item.forbidden, `${file}:${String(item.id)}.forbidden`);
  if (item.preconditions !== undefined) {
    assertStringArray(
      item.preconditions,
      `${file}:${String(item.id)}.preconditions`,
    );
  }
  if (
    item.skillMode !== undefined &&
    item.skillMode !== 'explicit' &&
    item.skillMode !== 'implicit'
  ) {
    throw new Error(`${file}: case ${String(item.id)} has invalid skillMode.`);
  }
  return item as unknown as PromptCase;
}

export async function loadPromptCases(
  testsRoot: string,
): Promise<Array<{ case: PromptCase; suiteFile: string }>> {
  const result: Array<{ case: PromptCase; suiteFile: string }> = [];
  const ids = new Set<string>();
  for (const suiteFile of suiteFiles) {
    const file = path.join(testsRoot, suiteFile);
    const parsed = YAML.parse(await fs.readFile(file, 'utf8')) as PromptSuite;
    if (
      parsed.version !== 1 ||
      parsed.skill !== 'nocobase-app-plugin-dag-flow' ||
      !Array.isArray(parsed.cases)
    ) {
      throw new Error(`Invalid prompt suite root: ${file}`);
    }
    for (const rawCase of parsed.cases) {
      const promptCase = validateCase(rawCase, suiteFile);
      if (ids.has(promptCase.id)) {
        throw new Error(`Duplicate prompt case id: ${promptCase.id}`);
      }
      ids.add(promptCase.id);
      result.push({ case: promptCase, suiteFile });
    }
  }
  return result;
}
