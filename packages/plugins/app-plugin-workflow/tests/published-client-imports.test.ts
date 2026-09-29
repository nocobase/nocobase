import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

const clientRoot = fileURLToPath(new URL('../client', import.meta.url));

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(file);
      return /\.tsx?$/.test(entry.name) ? [file] : [];
    }),
  );
  return files.flat();
}

// dist/client ships to applications that install this plugin from a registry.
// Vite pre-bundles it there with esbuild, which runs no Vite plugin, so any id
// only a Vite plugin can resolve fails the application's dev server. The
// monorepo cannot show this: a workspace link is never pre-bundled.
it('imports nothing from client code that only a Vite plugin can resolve', async () => {
  const offenders: string[] = [];
  for (const file of await sourceFiles(clientRoot)) {
    const source = ts.createSourceFile(
      file,
      await fs.readFile(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node: ts.Node): void => {
      const specifier =
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
          ? node.moduleSpecifier.text
          : ts.isCallExpression(node) &&
              node.expression.kind === ts.SyntaxKind.ImportKeyword &&
              node.arguments[0] &&
              ts.isStringLiteralLike(node.arguments[0])
            ? node.arguments[0].text
            : undefined;
      if (specifier?.startsWith('virtual:'))
        offenders.push(`${path.relative(clientRoot, file)}: ${specifier}`);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  expect(offenders).toEqual([]);
});
