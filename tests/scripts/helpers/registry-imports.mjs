import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

// Parse syntax rather than matching text: comments and ordinary strings are not imports.
export function importsOf(file, content) {
  const source = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = [];
  function visit(node) {
    let literal;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      literal = node.moduleSpecifier;
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      literal = node.argument.literal;
    } else if (ts.isExternalModuleReference(node)) {
      literal = node.expression;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      literal = node.arguments[0];
    }
    if (literal && ts.isStringLiteralLike(literal)) {
      const { line, character } = source.getLineAndCharacterOfPosition(
        literal.getStart(source),
      );
      imports.push({
        specifier: literal.text,
        line: line + 1,
        column: character + 1,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return imports;
}

export function assertPortableImports(files) {
  const errors = [];
  for (const { path: file, content } of files) {
    if (!/\.[cm]?[jt]sx?$/u.test(file)) continue;
    for (const { specifier, line, column } of importsOf(file, content)) {
      if (/^(?:@\/|~\/|\$\/|\/)/u.test(specifier)) {
        errors.push(
          `${file}:${line}:${column}: build-tool alias ${JSON.stringify(specifier)}`,
        );
      }
    }
  }
  assert.equal(
    errors.length,
    0,
    `Registry imports must use package imports (#), relative paths or npm packages.\n${errors.slice(0, 25).join('\n')}\n${errors.length} violation(s)`,
  );
}

export function sourceFiles(root) {
  return fs
    .readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.[cm]?[jt]sx?$/u.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

export function assertResolvableImports(root, options) {
  const files = sourceFiles(path.join(root, 'client'));
  assertPortableImports(
    files.map((file) => ({
      path: file,
      content: fs.readFileSync(file, 'utf8'),
    })),
  );
  for (const file of files) {
    for (const { specifier, line, column } of importsOf(
      file,
      fs.readFileSync(file, 'utf8'),
    )) {
      const result = ts.resolveModuleName(
        specifier,
        file,
        options,
        ts.sys,
      ).resolvedModule;
      assert.ok(
        result,
        `${file}:${line}:${column}: cannot resolve ${JSON.stringify(specifier)}`,
      );
    }
  }
  const program = ts.createProgram(files, options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (file) => file,
      getNewLine: () => '\n',
    }),
  );
  return program;
}
