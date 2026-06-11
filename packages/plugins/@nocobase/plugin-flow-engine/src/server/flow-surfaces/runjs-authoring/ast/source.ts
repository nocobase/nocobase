/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CallArgumentSource, SourceRange } from '../internal-types';
import { NON_METHOD_CALL_KEYWORDS } from '../runtime/constants';

export function maskJavaScriptSource(source: string) {
  const chars = source.split('');
  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      maskRange(start, index);
      continue;
    }
    if (char === '`') {
      index = maskTemplateLiteral(source, chars, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(chars, index)) {
      const start = index;
      index = skipRegexLiteral(source, index);
      maskRange(start, index);
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      const start = index;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

export function maskJavaScriptComments(source: string) {
  const chars = source.split('');
  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      maskRange(start, index);
      continue;
    }
    if (char === '`') {
      index = maskTemplateLiteralComments(source, chars, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(chars, index)) {
      index = skipRegexLiteral(source, index);
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipQuotedLiteral(source, index, char);
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

export function maskTemplateLiteralComments(source: string, chars: string[], start: number) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      const expressionStart = index + 2;
      const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
      const expressionMasked = maskJavaScriptComments(source.slice(expressionStart, expressionEnd));
      for (let offset = 0; offset < expressionMasked.length; offset += 1) {
        chars[expressionStart + offset] = expressionMasked[offset];
      }
      index = Math.min(source.length, expressionEnd + 1);
      continue;
    }
    index += 1;
  }
  return source.length;
}

export function maskTemplateLiteral(source: string, chars: string[], start: number) {
  const maskRange = (from: number, to: number) => {
    for (let index = from; index < to; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  maskRange(start, start + 1);
  let index = start + 1;
  let chunkStart = index;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      maskRange(chunkStart, index + 1);
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      maskRange(chunkStart, index + 2);
      const expressionStart = index + 2;
      const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
      const expressionMasked = maskJavaScriptSource(source.slice(expressionStart, expressionEnd));
      for (let offset = 0; offset < expressionMasked.length; offset += 1) {
        chars[expressionStart + offset] = expressionMasked[offset];
      }
      if (expressionEnd < source.length) {
        maskRange(expressionEnd, expressionEnd + 1);
      }
      index = Math.min(source.length, expressionEnd + 1);
      chunkStart = index;
      continue;
    }
    index += 1;
  }
  maskRange(chunkStart, source.length);
  return source.length;
}

export function findTemplateExpressionEnd(source: string, start: number) {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipQuotedLiteral(source, index, char);
      continue;
    }
    if (char === '`') {
      index = skipTemplateLiteral(source, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(source, index)) {
      index = skipRegexLiteral(source, index);
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }
  return source.length;
}

export function skipRegexLiteral(source: string, start: number) {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '[') {
      inCharacterClass = true;
      index += 1;
      continue;
    }
    if (char === ']' && inCharacterClass) {
      inCharacterClass = false;
      index += 1;
      continue;
    }
    if ((char === '\n' || char === '\r') && !inCharacterClass) {
      return index;
    }
    if (char === '/' && !inCharacterClass) {
      index += 1;
      while (index < source.length && /[A-Za-z]/.test(source[index])) {
        index += 1;
      }
      return index;
    }
    index += 1;
  }
  return source.length;
}

export function isRegexLiteralStart(sourceLike: string | string[], slashIndex: number) {
  const previous = getPreviousSignificantToken(sourceLike, slashIndex);
  if (!previous) {
    return true;
  }
  if (/^[([{=,:;!~?&|^+\-*%<>]$/.test(previous)) {
    return true;
  }
  return ['return', 'throw', 'case', 'delete', 'void', 'typeof', 'instanceof', 'yield', 'await', 'else'].includes(
    previous,
  );
}

export function getPreviousSignificantToken(sourceLike: string | string[], beforeIndex: number) {
  return getPreviousSignificantTokenInfo(sourceLike, beforeIndex)?.token || '';
}

export function getPreviousSignificantTokenInfo(sourceLike: string | string[], beforeIndex: number) {
  let index = beforeIndex - 1;
  while (index >= 0 && /\s/.test(sourceLike[index])) {
    index -= 1;
  }
  if (index < 0) {
    return undefined;
  }
  const char = sourceLike[index];
  if (/[A-Za-z_$]/.test(char)) {
    let start = index;
    while (start > 0 && /[\w$]/.test(sourceLike[start - 1])) {
      start -= 1;
    }
    return {
      token: Array.isArray(sourceLike)
        ? sourceLike.slice(start, index + 1).join('')
        : sourceLike.slice(start, index + 1),
      start,
      end: index + 1,
    };
  }
  return {
    token: char,
    start: index,
    end: index + 1,
  };
}

export function skipQuotedLiteral(source: string, start: number, quote: string) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
}

export function skipTemplateLiteral(source: string, start: number) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      const expressionEnd = findTemplateExpressionEnd(source, index + 2);
      index = Math.min(source.length, expressionEnd + 1);
      continue;
    }
    index += 1;
  }
  return source.length;
}

export function findFunctionRanges(masked: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  collectFunctionRanges(masked, /\bfunction\b[^{]*\{/g, ranges);
  collectFunctionRanges(masked, /=>\s*\{/g, ranges);
  collectArrowExpressionRanges(masked, ranges);
  collectMethodFunctionRanges(masked, ranges);
  return mergeRanges(ranges);
}

export function collectFunctionRanges(masked: string, pattern: RegExp, ranges: SourceRange[]) {
  for (const match of masked.matchAll(pattern)) {
    const openBrace = masked.indexOf('{', match.index || 0);
    if (openBrace < 0) {
      continue;
    }
    const closeBrace = findMatchingBrace(masked, openBrace);
    if (closeBrace > openBrace) {
      ranges.push({ start: openBrace, end: closeBrace + 1 });
    }
  }
}

export function collectArrowExpressionRanges(masked: string, ranges: SourceRange[]) {
  for (const match of masked.matchAll(/=>/g)) {
    let start = (match.index || 0) + match[0].length;
    while (start < masked.length && /\s/.test(masked[start])) {
      start += 1;
    }
    if (masked[start] === '{') {
      continue;
    }
    const end = findArrowExpressionEnd(masked, start);
    if (end > start) {
      ranges.push({ start, end });
    }
  }
}

export function collectMethodFunctionRanges(masked: string, ranges: SourceRange[]) {
  collectMethodCandidates(masked).forEach((candidate) => {
    ranges.push(candidate.bodyRange);
  });
}

export function findBraceBodyAfter(masked: string, afterIndex: number): SourceRange | undefined {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] !== '{') {
    return undefined;
  }
  const closeBrace = findMatchingDelimiter(masked, cursor);
  return closeBrace > cursor ? { start: cursor, end: closeBrace + 1 } : undefined;
}

export function collectMethodCandidates(masked: string) {
  const candidates: Array<{ paramsStart: number; paramsEnd: number; bodyRange: SourceRange }> = [];
  const pattern = /\b(?:(?:static|async|get|set)\s+)*(?:\*\s*)?([A-Za-z_$][\w$]*)\s*\(/g;
  for (const match of masked.matchAll(pattern)) {
    const matchIndex = match.index || 0;
    const methodName = match[1];
    if (NON_METHOD_CALL_KEYWORDS.has(methodName)) {
      continue;
    }
    const previous = getPreviousSignificantToken(masked, matchIndex);
    if (!['{', ',', ';', '}'].includes(previous)) {
      continue;
    }
    const openParen = masked.indexOf('(', matchIndex);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      candidates.push({
        paramsStart: openParen + 1,
        paramsEnd: closeParen,
        bodyRange,
      });
    }
  }
  collectComputedMethodCandidates(masked, candidates);
  return candidates;
}

export function collectComputedMethodCandidates(
  masked: string,
  candidates: Array<{ paramsStart: number; paramsEnd: number; bodyRange: SourceRange }>,
) {
  for (const match of masked.matchAll(/\[/g)) {
    const openBracket = match.index || 0;
    const previous = findMethodPrefixToken(masked, openBracket);
    if (!['{', ',', ';', '}'].includes(previous)) {
      continue;
    }
    const closeBracket = findMatchingDelimiter(masked, openBracket);
    if (closeBracket <= openBracket) {
      continue;
    }
    let openParen = closeBracket + 1;
    while (openParen < masked.length && /\s/.test(masked[openParen])) {
      openParen += 1;
    }
    if (masked[openParen] !== '(') {
      continue;
    }
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      candidates.push({
        paramsStart: openParen + 1,
        paramsEnd: closeParen,
        bodyRange,
      });
    }
  }
}

export function findMethodPrefixToken(masked: string, beforeIndex: number) {
  let previous = getPreviousSignificantTokenInfo(masked, beforeIndex);
  while (previous && ['static', 'async', 'get', 'set', '*'].includes(previous.token)) {
    previous = getPreviousSignificantTokenInfo(masked, previous.start);
  }
  return previous?.token || '';
}

export function findArrowExpressionEnd(masked: string, start: number) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < masked.length; index += 1) {
    const char = masked[index];
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === ';' || char === ',' || char === '\n' || char === '\r') {
        return index;
      }
      if (char === ')') {
        return index;
      }
    }
    if (char === '(') {
      parenDepth += 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    }
  }
  return masked.length;
}

export function findMatchingBrace(masked: string, openBrace: number) {
  return findMatchingDelimiter(masked, openBrace);
}

export function findMatchingDelimiter(masked: string, openIndex: number) {
  const closeByOpen: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  };
  const stack = [closeByOpen[masked[openIndex]]];
  if (!stack[0]) {
    return -1;
  }
  for (let index = openIndex + 1; index < masked.length; index += 1) {
    const char = masked[index];
    if (closeByOpen[char]) {
      stack.push(closeByOpen[char]);
      continue;
    }
    if (char === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) {
        return index;
      }
    }
  }
  return -1;
}

export function collectBraceRanges(masked: string) {
  const ranges: SourceRange[] = [];
  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] !== '{') {
      continue;
    }
    const closeBrace = findMatchingDelimiter(masked, index);
    if (closeBrace > index) {
      ranges.push({ start: index, end: closeBrace + 1 });
    }
  }
  return ranges;
}

export function collectStaticBlockRanges(masked: string) {
  const ranges: SourceRange[] = [];
  for (const match of masked.matchAll(/\bstatic\s*\{/g)) {
    const openBrace = masked.indexOf('{', match.index || 0);
    const closeBrace = findMatchingDelimiter(masked, openBrace);
    if (closeBrace > openBrace) {
      ranges.push({ start: openBrace, end: closeBrace + 1 });
    }
  }
  return mergeRanges(ranges);
}

export function mergeRanges(ranges: SourceRange[]) {
  const sorted = ranges.slice().sort((left, right) => left.start - right.start);
  const merged: SourceRange[] = [];
  sorted.forEach((range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
      return;
    }
    merged.push({ ...range });
  });
  return merged;
}

export function isInsideRanges(index: number, ranges: SourceRange[]) {
  return ranges.some((range) => index >= range.start && index < range.end);
}

export function findMatches(masked: string, pattern: RegExp) {
  return [...masked.matchAll(pattern)].map((match) => ({
    index: match.index || 0,
    match: match[0],
  }));
}

export function trimBindingElement(pattern: string) {
  const withoutRest = pattern
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  const equal = findTopLevelChar(withoutRest, '=');
  return (equal >= 0 ? withoutRest.slice(0, equal) : withoutRest).trim();
}

export function stripEnclosure(pattern: string, open: string, close: string) {
  const trimmed = pattern.trim();
  return trimmed.startsWith(open) && trimmed.endsWith(close) ? trimmed.slice(1, -1) : trimmed;
}

export function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

export function splitTopLevelWithRanges(value: string, separator: string) {
  const parts: CallArgumentSource[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push({ source: value.slice(start, index), start, end: index });
      start = index + 1;
    }
  }
  parts.push({ source: value.slice(start), start, end: value.length });
  return parts;
}

export function findTopLevelChar(value: string, target: string) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === target && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index;
    }
  }
  return -1;
}

export function readLeadingStringLiteral(value: string) {
  const index = skipJavaScriptTrivia(value, 0);
  const quote = value[index];
  if (quote !== '"' && quote !== "'" && quote !== '`') {
    return undefined;
  }
  let cursor = index + 1;
  let output = '';
  while (cursor < value.length) {
    const char = value[cursor];
    if (char === '\\') {
      output += value.slice(cursor, Math.min(value.length, cursor + 2));
      cursor += 2;
      continue;
    }
    if (char === quote) {
      return {
        value: output,
        end: cursor + 1,
      };
    }
    output += char;
    cursor += 1;
  }
  return undefined;
}

export function readCompleteStringLiteral(value: string) {
  const index = skipJavaScriptTrivia(value, 0);
  const literal = readLeadingStringLiteral(value);
  if (!literal) {
    return undefined;
  }
  const rawLiteral = value.slice(index, literal.end);
  if (rawLiteral.startsWith('`') && rawLiteral.includes('${')) {
    return undefined;
  }
  const rest = value.slice(literal.end);
  if (/^[ \t]*(?:\r\n|\r|\n)/.test(rest)) {
    return literal;
  }
  const restIndex = skipJavaScriptTrivia(rest, 0);
  const next = rest[restIndex];
  if (!next || /[,;)\]}]/.test(next)) {
    return literal;
  }
  return undefined;
}

export function skipJavaScriptTrivia(value: string, start: number) {
  let index = start;
  while (index < value.length) {
    while (index < value.length && /\s/.test(value[index])) {
      index += 1;
    }
    if (value[index] === '/' && value[index + 1] === '/') {
      index += 2;
      while (index < value.length && value[index] !== '\n' && value[index] !== '\r') {
        index += 1;
      }
      continue;
    }
    if (value[index] === '/' && value[index + 1] === '*') {
      index += 2;
      while (index < value.length && !(value[index] === '*' && value[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(value.length, index + 2);
      continue;
    }
    return index;
  }
  return index;
}

export function getCallFirstArgumentSource(source: string, masked: string, index: number) {
  return getCallArgumentSources(source, masked, index)[0]?.source || '';
}

export function getCallArgumentSources(source: string, masked: string, index: number) {
  const args: CallArgumentSource[] = [];
  const openParen = masked.indexOf('(', index);
  if (openParen < 0) {
    return args;
  }
  let parenDepth = 1;
  let bracketDepth = 0;
  let braceDepth = 0;
  let argStart = openParen + 1;
  for (let cursor = openParen + 1; cursor < masked.length; cursor += 1) {
    const char = masked[cursor];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
      if (parenDepth === 0) {
        if (cursor > argStart || source.slice(argStart, cursor).trim()) {
          args.push({
            source: source.slice(argStart, cursor),
            start: argStart,
            end: cursor,
          });
        }
        return args;
      }
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === ',' && parenDepth === 1 && bracketDepth === 0 && braceDepth === 0) {
      args.push({
        source: source.slice(argStart, cursor),
        start: argStart,
        end: cursor,
      });
      argStart = cursor + 1;
    }
  }
  return args;
}

export function getCallArgumentSource(source: string, masked: string, index: number) {
  const openParen = masked.indexOf('(', index);
  if (openParen < 0) {
    return '';
  }
  let depth = 0;
  for (let cursor = openParen; cursor < masked.length; cursor += 1) {
    if (masked[cursor] === '(') {
      depth += 1;
    } else if (masked[cursor] === ')') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openParen + 1, cursor);
      }
    }
  }
  return '';
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getAstSource(node: any, source: string) {
  return source.slice(node?.start || 0, node?.end || node?.start || 0).trim();
}
