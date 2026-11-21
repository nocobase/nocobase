// @vitest-environment node
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
// The Roles and permissions pages moved from the templates into the authorization plugin, which renders the same
// filter and Default access editors the Registry installs into an application that builds its own. The role editor is
// the plugin's own: its page access, operations, members and review follow the plugin's role detail, so the Registry
// keeps the general-purpose permission editor.
it('keeps the Registry authorization editors and the authorization plugin’s copies synchronized', () => {
  const read = (file: string): string =>
    readFileSync(new URL(file, import.meta.url), 'utf8');
  for (const file of ['default-access-editor.tsx', 'permission-filter.tsx'])
    expect(
      read(
        `../../../packages/plugins/app-plugin-authorization/client/components/${file}`,
      ),
      file,
    ).toBe(read(`../../registry/authorization/${file}`));
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
