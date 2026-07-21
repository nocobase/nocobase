/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const RUNJS_LINE_MAP_VERSION = 1 as const;
export const RUNJS_LINE_MAP_KIND = 'runjs-line-map' as const;
export const RUNJS_SOURCE_URL_PREFIX = 'nocobase-runjs://bundle/';

// JSRunner evaluates compiled code inside `(async () => {` and `try {` before the first generated code line.
// Keep this value in the emitted artifact contract so consumers never need their own wrapper-offset magic number.
export const RUNJS_EVALUATION_WRAPPER_LINE_OFFSET = 2;

export interface RunJSLineMappingV1 {
  /** One-based line in the compiled Artifact before JSRunner adds its evaluation wrapper. */
  generatedLine: number;
  /** One-based column in the compiled Artifact. Older V1 maps may omit this field. */
  generatedColumn?: number;
  /** Workspace-relative source path. */
  source: string;
  /** One-based original source line. */
  sourceLine: number;
  /** One-based original source column. */
  sourceColumn?: number;
}

export interface RunJSLineMapV1 {
  version: typeof RUNJS_LINE_MAP_VERSION;
  kind: typeof RUNJS_LINE_MAP_KIND;
  sourceURL: string;
  entryPath: string;
  /** Number of one-based stack-frame lines added before the compiled Artifact code. */
  generatedCodeLineOffset: number;
  mappings: RunJSLineMappingV1[];
}

export interface RunJSStackFrame {
  url: string;
  /** One-based generated line. */
  line: number;
  /** One-based generated column. */
  column: number;
  raw: string;
}

export interface MappedRunJSStackFrame extends RunJSStackFrame {
  source: string;
  /** One-based original source line. */
  sourceLine: number;
  /** One-based original source column when it can be derived safely. */
  sourceColumn?: number;
}

const windowsAbsolutePath = /^[A-Za-z]:\//u;
const runJSSourceURLPattern = /^nocobase-runjs:\/\/bundle\/[A-Za-z0-9._-]+\.js$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isSafeWorkspacePath(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.startsWith('/') || windowsAbsolutePath.test(value)) {
    return false;
  }
  if (value.includes('://') || value.includes('\\')) {
    return false;
  }
  return !value.split('/').some((segment) => segment === '..' || segment === '');
}

export function isRunJSSourceURL(value: unknown): value is string {
  return typeof value === 'string' && runJSSourceURLPattern.test(value);
}

export function buildRunJSSourceURL(bundleId: string): string {
  return `${RUNJS_SOURCE_URL_PREFIX}${bundleId}.js`;
}

export function appendRunJSSourceURL(code: string, sourceURL: string): string {
  if (!code || !isRunJSSourceURL(sourceURL)) {
    return code;
  }
  return `${code}\n//# sourceURL=${sourceURL}`;
}

export function wrapRunJSCodeForEvaluation(code: string): string {
  return `(async () => {
      try {
        ${code};
      } catch (e) {
        throw e;
      }
    })()`;
}

export function parseRunJSLineMapV1(value: unknown): RunJSLineMapV1 | undefined {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!isRecord(parsed)) {
    return undefined;
  }
  if (
    parsed.version !== RUNJS_LINE_MAP_VERSION ||
    parsed.kind !== RUNJS_LINE_MAP_KIND ||
    !isRunJSSourceURL(parsed.sourceURL) ||
    !isSafeWorkspacePath(parsed.entryPath) ||
    !isNonNegativeInteger(parsed.generatedCodeLineOffset) ||
    !Array.isArray(parsed.mappings)
  ) {
    return undefined;
  }

  const mappings: RunJSLineMappingV1[] = [];
  for (const candidate of parsed.mappings) {
    if (!isRecord(candidate)) {
      return undefined;
    }
    if (
      !isPositiveInteger(candidate.generatedLine) ||
      !isSafeWorkspacePath(candidate.source) ||
      !isPositiveInteger(candidate.sourceLine)
    ) {
      return undefined;
    }
    if (typeof candidate.generatedColumn !== 'undefined' && !isPositiveInteger(candidate.generatedColumn)) {
      return undefined;
    }
    if (typeof candidate.sourceColumn !== 'undefined' && !isPositiveInteger(candidate.sourceColumn)) {
      return undefined;
    }
    mappings.push({
      generatedLine: candidate.generatedLine,
      ...(typeof candidate.generatedColumn === 'number' ? { generatedColumn: candidate.generatedColumn } : {}),
      source: candidate.source,
      sourceLine: candidate.sourceLine,
      ...(typeof candidate.sourceColumn === 'number' ? { sourceColumn: candidate.sourceColumn } : {}),
    });
  }

  if (!mappings.length) {
    return undefined;
  }

  mappings.sort(
    (left, right) =>
      left.generatedLine - right.generatedLine || (left.generatedColumn || 1) - (right.generatedColumn || 1),
  );

  return {
    version: RUNJS_LINE_MAP_VERSION,
    kind: RUNJS_LINE_MAP_KIND,
    sourceURL: parsed.sourceURL,
    entryPath: parsed.entryPath,
    generatedCodeLineOffset: parsed.generatedCodeLineOffset,
    mappings,
  };
}

export function parseRunJSStackFrames(stack: string): RunJSStackFrame[] {
  const frames: RunJSStackFrame[] = [];
  const pattern = /((?:nocobase-runjs|https?|file):\/\/[^\s)]+|<anonymous>):(\d+):(\d+)/gu;
  for (const match of String(stack || '').matchAll(pattern)) {
    const line = Number(match[2]);
    const column = Number(match[3]);
    if (!isPositiveInteger(line) || !isPositiveInteger(column)) {
      continue;
    }
    frames.push({
      url: match[1],
      line,
      column,
      raw: match[0],
    });
  }
  return frames;
}

function selectLineMapping(
  lineMap: RunJSLineMapV1,
  generatedLine: number,
  generatedColumn: number,
): RunJSLineMappingV1 | undefined {
  const lineMappings = lineMap.mappings.filter((mapping) => mapping.generatedLine === generatedLine);
  if (!lineMappings.length) {
    return undefined;
  }

  const preceding = lineMappings.filter(
    (mapping) => typeof mapping.generatedColumn !== 'number' || mapping.generatedColumn <= generatedColumn,
  );
  if (preceding.length) {
    return preceding[preceding.length - 1];
  }
  return lineMappings.find((mapping) => typeof mapping.generatedColumn !== 'number');
}

export function mapRunJSStackFrame(lineMap: RunJSLineMapV1, frame: RunJSStackFrame): MappedRunJSStackFrame | undefined {
  // Never guess that an anonymous or nested-eval frame belongs to this Artifact.
  if (frame.url !== lineMap.sourceURL) {
    return undefined;
  }

  const generatedLine = frame.line - lineMap.generatedCodeLineOffset;
  if (!isPositiveInteger(generatedLine)) {
    return undefined;
  }
  const mapping = selectLineMapping(lineMap, generatedLine, frame.column);
  if (!mapping) {
    return undefined;
  }

  let sourceColumn = mapping.sourceColumn;
  if (sourceColumn && mapping.generatedColumn && frame.column >= mapping.generatedColumn) {
    sourceColumn += frame.column - mapping.generatedColumn;
  }

  return {
    ...frame,
    source: mapping.source,
    sourceLine: mapping.sourceLine,
    ...(sourceColumn ? { sourceColumn } : {}),
  };
}

export function getFirstMappedRunJSStackFrame(
  stack: string,
  lineMap: RunJSLineMapV1,
): MappedRunJSStackFrame | undefined {
  for (const frame of parseRunJSStackFrames(stack)) {
    const mapped = mapRunJSStackFrame(lineMap, frame);
    if (mapped) {
      return mapped;
    }
  }
  return undefined;
}

export function mapRunJSStack(stack: string, lineMap: RunJSLineMapV1): string {
  let output = String(stack || '');
  for (const frame of parseRunJSStackFrames(output)) {
    const mapped = mapRunJSStackFrame(lineMap, frame);
    if (!mapped) {
      continue;
    }
    const mappedLocation = `${mapped.source}:${mapped.sourceLine}${
      mapped.sourceColumn ? `:${mapped.sourceColumn}` : ''
    }`;
    output = output.replace(frame.raw, mappedLocation);
  }
  return output;
}
