// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

// Consumers may install these blocks into a plugin, whose build emits isolated declarations.
// Check the actual published file list so new locale files and entry points receive the same coverage.
const root = path.resolve(import.meta.dirname, '../..');
for (const group of ['file', 'notification']) {
  const registry = JSON.parse(
    readFileSync(path.join(root, 'registry', group, 'registry.json'), 'utf8'),
  ) as { items: { files: { path: string }[] }[] };
  for (const file of registry.items.flatMap((item) => item.files)) {
    it(`emits portable declarations for ${group}/${file.path}`, () => {
      const filename = path.join(root, 'registry', group, file.path);
      const result = ts.transpileDeclaration(readFileSync(filename, 'utf8'), {
        fileName: filename,
        reportDiagnostics: true,
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
      });
      expect(
        (result.diagnostics ?? []).map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        ),
      ).toEqual([]);
    });
  }
}
