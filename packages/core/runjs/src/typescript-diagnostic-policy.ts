/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type TypeScriptModule = typeof import('typescript');

export type RunJSTypeScriptDiagnosticPolicy = 'default' | 'runjs-authoring';

export type RunJSForbiddenTypeScriptDirective = '@ts-expect-error' | '@ts-ignore' | '@ts-nocheck';

export interface RunJSForbiddenTypeScriptDirectiveOccurrence {
  column: number;
  directive: RunJSForbiddenTypeScriptDirective;
  from: number;
  line: number;
  to: number;
}

const forbiddenTypeScriptDirectivePattern = /@ts-(?:nocheck|ignore|expect-error)\b/gi;

export function formatRunJSTypeScriptDiagnosticMessage(
  policy: RunJSTypeScriptDiagnosticPolicy,
  code: number,
  message: string,
): string {
  if (
    policy === 'runjs-authoring' &&
    ((code === 2686 && /['"]React['"]/.test(message)) ||
      (code === 2304 && /Cannot find name ['"]React['"]/.test(message)) ||
      (code === 2708 && /Cannot use namespace ['"]React['"] as a value/.test(message)))
  ) {
    return "'React' is not available as a RunJS runtime global. Use 'ctx.libs.React' instead.";
  }
  return message;
}

export function shouldKeepRunJSTypeScriptDiagnostic(
  policy: RunJSTypeScriptDiagnosticPolicy,
  code: number,
  message: string,
): boolean {
  if (policy !== 'runjs-authoring') {
    return true;
  }
  if (code === 2554) {
    return false;
  }
  if (code === 2339 && /^Property .+ does not exist on type ['"]unknown['"]\.$/.test(message)) {
    return false;
  }
  if (code === 2571 && message === "Object is of type 'unknown'.") {
    return false;
  }
  return !(code === 18046 && /^(['"]).+\1 is of type ['"]unknown['"]\.$/.test(message));
}

export function collectRunJSForbiddenTypeScriptDirectives(
  ts: TypeScriptModule,
  source: string,
): RunJSForbiddenTypeScriptDirectiveOccurrence[] {
  const occurrences: RunJSForbiddenTypeScriptDirectiveOccurrence[] = [];
  const sourceFile = ts.createSourceFile('runjs-source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const commentRanges = new Map<string, import('typescript').CommentRange>();
  const collectRanges = (ranges: readonly import('typescript').CommentRange[] | undefined) => {
    for (const range of ranges || []) {
      commentRanges.set(`${range.pos}:${range.end}`, range);
    }
  };
  const visit = (node: import('typescript').Node) => {
    collectRanges(ts.getLeadingCommentRanges(source, node.pos));
    collectRanges(ts.getTrailingCommentRanges(source, node.end));
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  collectRanges(ts.getLeadingCommentRanges(source, source.length));
  collectRanges(ts.getTrailingCommentRanges(source, source.length));

  for (const range of commentRanges.values()) {
    const tokenStart = range.pos;
    const tokenText = source.slice(range.pos, range.end);
    forbiddenTypeScriptDirectivePattern.lastIndex = 0;
    let match = forbiddenTypeScriptDirectivePattern.exec(tokenText);
    while (match) {
      const from = tokenStart + match.index;
      const location = getSourceLocation(source, from);
      occurrences.push({
        column: location.column,
        directive: match[0].toLowerCase() as RunJSForbiddenTypeScriptDirective,
        from,
        line: location.line,
        to: from + match[0].length,
      });
      match = forbiddenTypeScriptDirectivePattern.exec(tokenText);
    }
  }

  return occurrences;
}

export function formatRunJSForbiddenTypeScriptDirectiveMessage(directive: RunJSForbiddenTypeScriptDirective): string {
  return `${directive} is not allowed in RunJS source. Fix the TypeScript error instead of suppressing diagnostics.`;
}

function getSourceLocation(source: string, position: number): { column: number; line: number } {
  const lineStart = source.lastIndexOf('\n', position - 1) + 1;
  let line = 1;
  for (let index = 0; index < lineStart; index += 1) {
    if (source[index] === '\n') {
      line += 1;
    }
  }
  return { column: position - lineStart + 1, line };
}
