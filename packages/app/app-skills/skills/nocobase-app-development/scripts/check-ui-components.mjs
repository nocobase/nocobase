import { readFileSync, readdirSync, lstatSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const controls = new Map([
  ['button', 'Button'],
  ['input', 'Input, Checkbox, Switch or another matching input primitive'],
  ['select', 'Select or NativeSelect'],
  ['textarea', 'Textarea'],
  ['dialog', 'Dialog or the owning route overlay'],
  ['summary', 'Accordion or Collapsible'],
]);
const widgetRoles = new Set([
  'button',
  'checkbox',
  'combobox',
  'dialog',
  'listbox',
  'menu',
  'menuitem',
  'radio',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'tree',
]);
const passiveTags = new Set([
  'div',
  'span',
  'li',
  'td',
  'tr',
  'section',
  'article',
  'svg',
]);
const ignoredDirectories = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'storage',
  'tests',
  '__tests__',
  '__fixtures__',
  'fixtures',
  'generated',
  'vendor',
]);

function inside(directory, file) {
  const path = relative(directory, file);
  return (
    path === '' ||
    (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
  );
}

function attribute(ts, node, name) {
  return node.attributes.properties.find(
    (item) => ts.isJsxAttribute(item) && item.name.text === name,
  );
}

function literal(ts, value) {
  if (value && ts.isJsxExpression(value)) value = value.expression;
  return value && ts.isStringLiteralLike(value) ? value.text : undefined;
}

/** Inspect JSX syntax, not strings or comments. The caller supplies its installed TypeScript. */
export function inspectSource(ts, text, file, root) {
  const kind =
    /\.[jt]sx?$/.test(file) && !file.endsWith('.ts')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  if (source.parseDiagnostics.length) {
    throw new Error(
      `${file}: ${ts.flattenDiagnosticMessageText(source.parseDiagnostics[0].messageText, '\n')}`,
    );
  }
  const primitives = new Set();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const specifier = statement.moduleSpecifier.text;
    const isPrimitive =
      specifier === '#components/ui' ||
      specifier.startsWith('#components/ui/') ||
      (specifier.startsWith('.') &&
        inside(
          resolve(root, 'client/components/ui'),
          resolve(dirname(file), specifier),
        ));
    const clause = statement.importClause;
    if (!isPrimitive || !clause || clause.isTypeOnly) continue;
    if (clause.name) primitives.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const item of clause.namedBindings.elements) {
        if (!item.isTypeOnly) primitives.add(item.name.text);
      }
    } else if (clause.namedBindings)
      namespaces.add(clause.namedBindings.name.text);
  }

  const exceptions = new Map();
  function rememberComment(start, end) {
    const comment = text
      .slice(start, end)
      .replace(/^\/\/|^\/\*|\*\/$/g, '')
      .trim();
    if (!comment.startsWith('ui-component-exception:')) return;
    exceptions.set(start, {
      line: source.getLineAndCharacterOfPosition(end).line,
      reason: comment.slice('ui-component-exception:'.length).trim(),
      used: false,
    });
  }
  function collectComments(node) {
    for (const comment of ts.getLeadingCommentRanges(
      text,
      node.getFullStart(),
    ) ?? []) {
      rememberComment(comment.pos, comment.end);
    }
    if (ts.isJsxExpression(node) && !node.expression) {
      const contents = node.getText(source);
      const comment = /^\{\s*(\/\*[\s\S]*?\*\/)\s*\}$/.exec(contents);
      if (comment) {
        const start = node.getStart(source) + contents.indexOf('/*');
        rememberComment(start, start + comment[1].length);
      }
    }
    ts.forEachChild(node, collectComments);
  }
  collectComments(source);

  function renderedByPrimitive(node) {
    let element = ts.isJsxOpeningElement(node) ? node.parent : node;
    while (element.parent && ts.isParenthesizedExpression(element.parent))
      element = element.parent;
    const expression = element.parent;
    if (
      !expression ||
      !ts.isJsxExpression(expression) ||
      expression.expression !== element
    )
      return false;
    const prop = expression.parent;
    if (!ts.isJsxAttribute(prop) || prop.name.text !== 'render') return false;
    const owner = prop.parent.parent;
    const tag = owner.tagName;
    return ts.isIdentifier(tag)
      ? primitives.has(tag.text)
      : ts.isPropertyAccessExpression(tag) &&
          ts.isIdentifier(tag.expression) &&
          namespaces.has(tag.expression.text);
  }

  const findings = [];
  const accepted = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (/^[a-z]/.test(tag) && !tag.includes('.')) {
        const hidden =
          tag === 'input' &&
          literal(ts, attribute(ts, node, 'type')?.initializer) === 'hidden';
        const role = literal(ts, attribute(ts, node, 'role')?.initializer);
        const clickable =
          passiveTags.has(tag) &&
          ['onClick', 'onPointerDown', 'onKeyDown'].some((name) =>
            attribute(ts, node, name),
          );
        const replacement =
          controls.get(tag) ??
          (widgetRoles.has(role) || clickable
            ? 'the matching shadcn interaction or an existing business component'
            : undefined);
        if (replacement && !hidden && !renderedByPrimitive(node)) {
          const position = source.getLineAndCharacterOfPosition(
            node.getStart(source),
          );
          const exception = [...exceptions.values()].find(
            (item) => item.line === position.line - 1 && !item.used,
          );
          const finding = {
            file,
            line: position.line + 1,
            column: position.character + 1,
            tag,
            replacement,
          };
          if (
            exception?.reason &&
            !/^(todo|n\/a|none)$/i.test(exception.reason)
          ) {
            exception.used = true;
            accepted.push({ ...finding, reason: exception.reason });
          } else findings.push(finding);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const exception of exceptions.values()) {
    if (!exception.used)
      findings.push({
        file,
        line: exception.line + 1,
        column: 1,
        tag: 'exception',
        replacement:
          'remove the stale marker or place a specific reason immediately above one flagged element',
      });
  }
  return { findings, accepted };
}

function collectFiles(root, requested) {
  const files = new Set();
  let skipped = 0;
  function visit(file) {
    if (!inside(root, file)) throw new Error(`Path is outside --root: ${file}`);
    const stat = lstatSync(file);
    const parts = relative(root, file).split(sep);
    if (
      stat.isSymbolicLink() ||
      parts.some(
        (part) => ignoredDirectories.has(part) || part.startsWith('.'),
      ) ||
      inside(resolve(root, 'client/components/ui'), file) ||
      /\.(test|spec|stories)\.[jt]sx?$/.test(file) ||
      file.endsWith('.d.ts')
    ) {
      skipped += 1;
      return;
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(file).sort()) visit(resolve(file, entry));
    } else if (/\.[jt]sx?$/.test(extname(file))) files.add(file);
  }
  for (const file of requested.length ? requested : ['client'])
    visit(resolve(root, file));
  return { files: [...files].sort(), skipped };
}

export function main(args) {
  let root = process.cwd();
  const requested = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--help') {
      console.log(
        'Usage: node check-ui-components.mjs [--root <app-or-plugin>] [files-or-directories...]\nPaths are relative to --root; default: client/. Exit 1: findings; exit 2: incomplete scan.',
      );
      return 0;
    }
    if (args[index] === '--root') {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error('--root needs a directory');
      root = resolve(args[++index]);
    } else if (args[index].startsWith('--'))
      throw new Error(`Unknown option: ${args[index]}`);
    else requested.push(args[index]);
  }
  const manifest = resolve(root, 'package.json');
  JSON.parse(readFileSync(manifest, 'utf8'));
  let ts;
  try {
    ts = createRequire(manifest)('typescript');
  } catch {
    throw new Error(
      `Cannot resolve TypeScript from ${root}. Install this project's development dependencies before checking.`,
    );
  }
  const { files, skipped } = collectFiles(root, requested);
  let findings = 0;
  let accepted = 0;
  for (const file of files) {
    const result = inspectSource(ts, readFileSync(file, 'utf8'), file, root);
    for (const item of result.findings) {
      console.log(
        `${relative(root, file)}:${item.line}:${item.column} <${item.tag}>: use ${item.replacement}.`,
      );
    }
    for (const item of result.accepted) {
      console.log(
        `${relative(root, file)}:${item.line}:${item.column} REVIEW EXCEPTION <${item.tag}>: ${item.reason}`,
      );
    }
    findings += result.findings.length;
    accepted += result.accepted.length;
  }
  console.log(
    `Scanned ${files.length} source files; skipped ${skipped} paths; ${findings} findings; ${accepted} exceptions requiring review.`,
  );
  return findings ? 1 : 0;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(
      `UI component check incomplete: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 2;
  }
}
