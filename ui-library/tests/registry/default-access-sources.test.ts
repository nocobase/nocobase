// @vitest-environment node
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
it('keeps the controlled Registry editor and both template administration implementations synchronized', () => {
  const read = (file: string): string =>
    readFileSync(new URL(file, import.meta.url), 'utf8');
  const canonical = read(
    '../../registry/authorization/default-access-editor.tsx',
  );
  for (const name of ['default', 'examples'])
    expect(
      read(
        `../../../packages/templates/app-template-${name}/client/components/default-access-editor.tsx`,
      ),
    ).toBe(canonical);
  for (const file of [
    'default-access.tsx',
    'default-access-form.tsx',
    'default-access-model.ts',
    'permission-management-page.tsx',
    'permission-filters.tsx',
  ])
    expect(
      read(
        `../../../packages/templates/app-template-default/client/pages/settings/${file}`,
      ),
    ).toBe(
      read(
        `../../../packages/templates/app-template-examples/client/pages/settings/${file}`,
      ),
    );
});

it('emits isolated plugin declarations for the new editor and its real primitive dependencies', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const output = mkdtempSync(
    path.join(tmpdir(), 'default-access-declarations-'),
  );
  try {
    execFileSync(
      process.execPath,
      [
        path.join(root, 'node_modules/typescript/bin/tsc'),
        '--ignoreConfig',
        '--isolatedDeclarations',
        '--declaration',
        '--emitDeclarationOnly',
        '--jsx',
        'react-jsx',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--target',
        'ES2022',
        '--skipLibCheck',
        '--rootDir',
        '.',
        '--outDir',
        output,
        'registry/authorization/default-access-editor.tsx',
      ],
      { cwd: root, encoding: 'utf8', stdio: 'pipe' },
    );
    expect(
      readFileSync(
        path.join(output, 'registry/authorization/default-access-editor.d.ts'),
        'utf8',
      ),
    ).toContain('export declare function DefaultAccessEditor');
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}, 30000);
