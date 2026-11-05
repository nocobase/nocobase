// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

// Consumers may install these blocks into a plugin, whose build emits isolated declarations.
// Check the actual published file list so new locale files and entry points receive the same coverage.
const root = path.resolve(import.meta.dirname, '../..');
for (const group of ['file', 'notification', 'components']) {
  const registry = JSON.parse(
    readFileSync(path.join(root, 'registry', group, 'registry.json'), 'utf8'),
  ) as { items: { name: string; files: { path: string }[] }[] };
  const items = registry.items.filter(
    (item) =>
      group !== 'components' ||
      ['loading', 'pending-button'].includes(item.name),
  );
  const files = new Set(
    items.flatMap((item) => item.files.map((file) => file.path)),
  );
  for (const file of files) {
    it(`emits portable declarations for ${group}/${file}`, () => {
      const filename = path.join(root, 'registry', group, file);
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
