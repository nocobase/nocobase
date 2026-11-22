/**
 * The packages an application's CLI composition root registers: the members of the array it passes to
 * `defineCliPlugins([...])`, each traced to the `<package>/cli` default import it names. An import the array does not
 * use registers nothing.
 *
 * `plugin inspect` and the App Foundation plugins page both read `cli/plugins` through this, so they agree on which
 * plugins the CLI registers. The source checkout's `cli/plugins.ts` and the `cli/plugins.js` a build compiles from it
 * have the same imports and the same array, and a deployment has no TypeScript to parse with, so the file is split
 * into JavaScript tokens — comments dropped, strings, template literals and regular expressions each kept whole as one
 * token — and the import declarations and the call are found in that token stream. Text that only looks like either,
 * inside a string, a template, a regular expression or a comment, is never a token of its own.
 */
export function listCliPluginRegistrations(sourceText: string): string[] {
  const tokens = tokenize(sourceText);
  const imports = defaultImports(tokens);
  const members = registeredMembers(tokens);
  const registered: string[] = [];
  for (const member of members) {
    const specifier = imports.get(member);
    if (!specifier?.endsWith('/cli')) continue;
    const packageName = specifier.slice(0, -'/cli'.length);
    if (!registered.includes(packageName)) registered.push(packageName);
  }
  return registered;
}

type Token =
  | { readonly kind: 'name'; readonly value: string }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'punctuator'; readonly value: string }
  /** A template literal, regular expression or number: one token whose text never matters here. */
  | { readonly kind: 'other' };

/** `import <binding> [, { … }] from '<specifier>'` → binding → specifier. `import type` declarations bind no value. */
function defaultImports(tokens: readonly Token[]): Map<string, string> {
  const imports = new Map<string, string>();
  for (let index = 0; index < tokens.length; index += 1) {
    if (!isName(tokens[index], 'import')) continue;
    const binding = tokens[index + 1];
    if (binding?.kind !== 'name' || binding.value === 'type') continue;
    let cursor = index + 2;
    if (isPunctuator(tokens[cursor], ',')) {
      cursor += 1;
      if (!isPunctuator(tokens[cursor], '{')) continue;
      while (cursor < tokens.length && !isPunctuator(tokens[cursor], '}'))
        cursor += 1;
      cursor += 1;
    }
    const specifier = tokens[cursor + 1];
    if (isName(tokens[cursor], 'from') && specifier?.kind === 'string')
      imports.set(binding.value, specifier.value);
  }
  return imports;
}

/** The plain names in the array of the first `defineCliPlugins([ … ])` call, in order. */
function registeredMembers(tokens: readonly Token[]): string[] {
  for (let index = 0; index < tokens.length; index += 1) {
    if (
      !isName(tokens[index], 'defineCliPlugins') ||
      isPunctuator(tokens[index - 1], '.') ||
      !isPunctuator(tokens[index + 1], '(') ||
      !isPunctuator(tokens[index + 2], '[')
    )
      continue;
    const members: string[] = [];
    let depth = 0;
    let element: Token[] = [];
    const flush = () => {
      const [only] = element;
      if (element.length === 1 && only.kind === 'name')
        members.push(only.value);
      element = [];
    };
    for (let cursor = index + 3; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor];
      if (token.kind === 'punctuator' && depth === 0) {
        if (token.value === ']') {
          flush();
          return members;
        }
        if (token.value === ',') {
          flush();
          continue;
        }
      }
      if (token.kind === 'punctuator') {
        if ('([{'.includes(token.value)) depth += 1;
        else if (')]}'.includes(token.value)) depth -= 1;
      }
      element.push(token);
    }
    return members;
  }
  return [];
}

function isName(token: Token | undefined, value: string): boolean {
  return token?.kind === 'name' && token.value === value;
}

function isPunctuator(token: Token | undefined, value: string): boolean {
  return token?.kind === 'punctuator' && token.value === value;
}

const NAME_START = /[A-Za-z_$\u0080-\uffff]/u;
const NAME_PART = /[\w$\u0080-\uffff]/u;
/** Names after which a `/` starts a regular expression rather than dividing. */
const KEYWORDS_BEFORE_EXPRESSION = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await',
]);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  /** Whether a `/` here would end an operand, so it divides; otherwise it opens a regular expression. */
  const afterOperand = (): boolean => {
    const previous = tokens.at(-1);
    if (!previous) return false;
    if (previous.kind === 'name')
      return !KEYWORDS_BEFORE_EXPRESSION.has(previous.value);
    if (previous.kind === 'punctuator') return ')]'.includes(previous.value);
    return true;
  };

  const skipQuoted = (start: number, quote: string): number => {
    let end = start + 1;
    while (end < source.length && source[end] !== quote) {
      if (source[end] === '\\') end += 1;
      else if (source[end] === '\n') break;
      end += 1;
    }
    return end + 1;
  };

  /** Skips a template literal starting at its backtick, including every `${ … }` it holds. */
  const skipTemplate = (start: number): number => {
    let end = start + 1;
    while (end < source.length) {
      const char = source[end];
      if (char === '\\') end += 2;
      else if (char === '`') return end + 1;
      else if (char === '$' && source[end + 1] === '{') end = skipCode(end + 2);
      else end += 1;
    }
    return end;
  };

  /** Skips code up to and past the `}` that closes a template substitution. */
  const skipCode = (start: number): number => {
    let depth = 0;
    let end = start;
    let previousOperand = false;
    while (end < source.length) {
      const char = source[end];
      const next = source[end + 1];
      if (char === '/' && next === '/') {
        const close = source.indexOf('\n', end);
        end = close === -1 ? source.length : close;
      } else if (char === '/' && next === '*') {
        const close = source.indexOf('*/', end + 2);
        end = close === -1 ? source.length : close + 2;
      } else if (char === "'" || char === '"') {
        end = skipQuoted(end, char);
        previousOperand = true;
      } else if (char === '`') {
        end = skipTemplate(end);
        previousOperand = true;
      } else if (char === '/' && !previousOperand) {
        end = skipRegExp(end);
        previousOperand = true;
      } else if (char === '{') {
        depth += 1;
        end += 1;
        previousOperand = false;
      } else if (char === '}') {
        if (depth === 0) return end + 1;
        depth -= 1;
        end += 1;
        previousOperand = false;
      } else if (/\s/u.test(char)) {
        end += 1;
      } else {
        previousOperand = NAME_PART.test(char) || char === ')' || char === ']';
        end += 1;
      }
    }
    return end;
  };

  /** Skips a regular expression literal starting at its `/`, character classes and flags included. */
  const skipRegExp = (start: number): number => {
    let end = start + 1;
    let inClass = false;
    while (end < source.length && source[end] !== '\n') {
      const char = source[end];
      if (char === '\\') end += 1;
      else if (char === '[') inClass = true;
      else if (char === ']') inClass = false;
      else if (char === '/' && !inClass) break;
      end += 1;
    }
    end += 1;
    while (end < source.length && NAME_PART.test(source[end])) end += 1;
    return end;
  };

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (/\s/u.test(char)) {
      index += 1;
    } else if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      index = end === -1 ? source.length : end;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      index = end === -1 ? source.length : end + 2;
    } else if (char === "'" || char === '"') {
      const end = skipQuoted(index, char);
      tokens.push({ kind: 'string', value: source.slice(index + 1, end - 1) });
      index = end;
    } else if (char === '`') {
      index = skipTemplate(index);
      tokens.push({ kind: 'other' });
    } else if (char === '/' && !afterOperand()) {
      index = skipRegExp(index);
      tokens.push({ kind: 'other' });
    } else if (NAME_START.test(char)) {
      let end = index + 1;
      while (end < source.length && NAME_PART.test(source[end])) end += 1;
      tokens.push({ kind: 'name', value: source.slice(index, end) });
      index = end;
    } else if (/[0-9]/u.test(char)) {
      let end = index + 1;
      while (end < source.length && /[\w.]/u.test(source[end])) end += 1;
      tokens.push({ kind: 'other' });
      index = end;
    } else {
      tokens.push({ kind: 'punctuator', value: char });
      index += 1;
    }
  }
  return tokens;
}
