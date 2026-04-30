/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ToolsUIProperties } from '@nocobase/client';
import { jsonrepair } from 'jsonrepair';
import { CodeBasic } from '../../chatbox/markdown/Code';

const toolArgsCache = new Map<string, Record<string, unknown>>();
const MIN_STREAMING_UPDATE_RATIO = 0.8;

function parseToolCallArgs(args: unknown) {
  if (typeof args !== 'string') {
    return args;
  }
  const trimmed = args.trim();
  if (!trimmed) {
    return {};
  }
  try {
    return JSON.parse(jsonrepair(trimmed));
  } catch (err) {
    return undefined;
  }
}

function getCodeArg(toolName: string, args: Record<string, unknown>) {
  if (toolName === 'writeJSCode') {
    return typeof args.code === 'string' ? args.code : undefined;
  }
  if (toolName === 'patchJSCode') {
    return typeof args.patch === 'string' ? args.patch : undefined;
  }
  return undefined;
}

export function getStableToolArgs(toolCall: ToolsUIProperties['toolCall']) {
  const parsedArgs = parseToolCallArgs(toolCall.args);
  const cached = toolArgsCache.get(toolCall.id);
  if (!parsedArgs || typeof parsedArgs !== 'object') {
    return cached ?? null;
  }

  const args = parsedArgs as Record<string, unknown>;
  const nextCode = getCodeArg(toolCall.name, args);
  const cachedCode = cached ? getCodeArg(toolCall.name, cached) : undefined;
  if (cachedCode) {
    if (!nextCode) {
      return cached;
    }
    if (nextCode.length < cachedCode.length * MIN_STREAMING_UPDATE_RATIO) {
      return cached;
    }
  }

  if (nextCode || !cached) {
    toolArgsCache.set(toolCall.id, args);
  }
  return toolArgsCache.get(toolCall.id) ?? null;
}

function splitLinesPreserveNewline(input: string) {
  if (!input) {
    return [];
  }
  return input.match(/[^\n]*\n|[^\n]+/g) ?? [];
}

function normalizeIdenticalPatchPairs(lines: string[]) {
  const result: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const current = lines[index];
    const next = lines[index + 1];
    if (
      current?.startsWith('-') &&
      next?.startsWith('+') &&
      !current.startsWith('---') &&
      !next.startsWith('+++') &&
      current.slice(1) === next.slice(1)
    ) {
      result.push(` ${current.slice(1)}`);
      index += 2;
      continue;
    }
    result.push(current);
    index++;
  }
  return result;
}

function trimPatchHunkContext(lines: string[], radius = 3) {
  const changeIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (line.startsWith('+') || line.startsWith('-')) {
      indexes.push(index);
    }
    return indexes;
  }, []);
  if (!changeIndexes.length || lines.length <= 80) {
    return lines;
  }

  const keep = new Set<number>();
  for (const index of changeIndexes) {
    for (let i = Math.max(0, index - radius); i <= Math.min(lines.length - 1, index + radius); i++) {
      keep.add(i);
    }
  }

  const result: string[] = [];
  let previous = -1;
  for (const index of [...keep].sort((a, b) => a - b)) {
    if (previous !== -1 && index > previous + 1) {
      result.push(' ...\n');
    }
    result.push(lines[index]);
    previous = index;
  }
  return result;
}

export function compactPatchForDisplay(patch: string) {
  const lines = splitLinesPreserveNewline(patch);
  const result: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.startsWith('@@ ')) {
      result.push(line);
      index++;
      continue;
    }

    result.push(line);
    index++;
    const hunkLines: string[] = [];
    while (index < lines.length && !lines[index].startsWith('@@ ')) {
      hunkLines.push(lines[index]);
      index++;
    }
    result.push(...trimPatchHunkContext(normalizeIdenticalPatchPairs(hunkLines)));
  }

  return result.join('');
}

export function buildToolCodeBlock(toolCall: ToolsUIProperties['toolCall']) {
  const args = getStableToolArgs(toolCall);
  if (!args) {
    return null;
  }

  if (toolCall.name === 'writeJSCode' && typeof args.code === 'string') {
    return { language: 'js', value: args.code };
  }
  if (toolCall.name === 'patchJSCode' && typeof args.patch === 'string') {
    return { language: 'diff', value: compactPatchForDisplay(args.patch) };
  }

  return null;
}

export const CodeToolCard: React.FC<ToolsUIProperties> = ({ toolCall }) => {
  const codeBlock = buildToolCodeBlock(toolCall);
  if (!codeBlock) {
    return null;
  }

  return (
    <div style={{ padding: '4px 12px' }}>
      <CodeBasic className={`language-${codeBlock.language}`}>{codeBlock.value}</CodeBasic>
    </div>
  );
};
