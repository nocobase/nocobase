// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(packageRoot, '../../..');
const skillRoot = path.join(packageRoot, 'skills/nocobase-app-plugin-file');

function snippet(section: string, language: string): string {
  const source = readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8')
    .split(`## ${section}\n`)[1]
    ?.split('\n## ')[0];
  if (!source) throw new Error('Missing Skill section: ' + section);
  const fence = '```' + language + '\n';
  const start = source.indexOf(fence);
  if (start === -1)
    throw new Error('Missing executable Skill example: ' + section);
  return source.slice(start + fence.length).split('```')[0]!;
}

it('builds a business attachment feature from the shipped Skill and materialized Registry', () => {
  const appRoot = mkdtempSync(path.join(tmpdir(), 'file-agent-app-'));
  try {
    mkdirSync(path.join(appRoot, 'node_modules/@nocobase'), {
      recursive: true,
    });
    const templateRoot = path.join(
      repoRoot,
      'packages/templates/app-template-default',
    );
    const templateRequire = createRequire(
      path.join(templateRoot, 'package.json'),
    );
    for (const name of [
      '@nocobase/app-plugin-file',
      '@nocobase/app-client',
      '@nocobase/i18n',
      '@nocobase/app-server',
      '@nocobase/db',
      '@nocobase/app-testing',
      '@nocobase/drive',
      '@nocobase/service-provider',
      '@nocobase/api-client',
      '@nocobase/dev-config',
      'typescript',
      'react',
      'react-dom',
      '@types/node',
      '@types/react',
      '@types/react-dom',
      'lucide-react',
      'react-markdown',
      'remark-gfm',
      '@silurus/ooxml',
      'hono',
      'tsx',
      '@base-ui/react',
      'class-variance-authority',
      'cn',
    ]) {
      const destination = path.join(appRoot, 'node_modules', name);
      mkdirSync(path.dirname(destination), { recursive: true });
      const local = path.join(packageRoot, 'node_modules', name);
      const origin =
        name === '@nocobase/app-plugin-file'
          ? packageRoot
          : realpathSync(
              existsSync(local)
                ? local
                : existsSync(path.join(repoRoot, 'node_modules', name))
                  ? path.join(repoRoot, 'node_modules', name)
                  : path.join(templateRoot, 'node_modules', name),
            );
      symlinkSync(origin, destination, 'dir');
    }
    // The receiving application owns the primitives and resolves their imports in its own package scope.
    mkdirSync(path.join(appRoot, 'client/components/ui'), { recursive: true });
    for (const name of ['button', 'dialog']) {
      cpSync(
        path.join(templateRoot, `client/components/ui/${name}.tsx`),
        path.join(appRoot, `client/components/ui/${name}.tsx`),
      );
    }
    writeFileSync(
      path.join(appRoot, 'package.json'),
      JSON.stringify({
        name: 'invoice-attachment-evaluation',
        type: 'module',
        imports: {
          '#components/*': './client/components/*.js',
          '#extensions/nocobase-file-component-ui':
            './client/extensions/nocobase-file-component-ui/index.ts',
        },
      }),
    );
    mkdirSync(path.join(appRoot, 'database/main/migrations'), {
      recursive: true,
    });
    writeFileSync(
      path.join(
        appRoot,
        'database/main/migrations/202609080001_create_invoice_files.ts',
      ),
      snippet('Collection', 'ts'),
    );
    writeFileSync(path.join(appRoot, 'routes.ts'), snippet('API routes', 'ts'));
    writeFileSync(
      path.join(appRoot, 'client/invoice-attachments.tsx'),
      snippet('Registry components', 'tsx'),
    );
    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/registry.mjs'),
        'build',
        '--package',
        packageRoot,
      ],
      { cwd: repoRoot },
    );
    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/registry.mjs'),
        'materialize',
        '--package',
        packageRoot,
        '--item',
        'component-ui',
        '--output-root',
        appRoot,
      ],
      { cwd: repoRoot },
    );
    const templateClient = path.join(templateRoot, 'client');
    writeFileSync(
      path.join(appRoot, 'tsconfig.json'),
      JSON.stringify({
        extends: '@nocobase/dev-config/tsconfig/client.json',
        compilerOptions: {
          types: ['node'],
        },
        include: ['client', path.join(templateClient, 'vite-env.d.ts')],
      }),
    );
    execFileSync(
      process.execPath,
      [
        templateRequire.resolve('typescript/bin/tsc'),
        '-p',
        path.join(appRoot, 'tsconfig.json'),
        '--noEmit',
      ],
      { cwd: appRoot, encoding: 'utf8', stdio: 'inherit' },
    );
    writeFileSync(
      path.join(appRoot, 'tsconfig.server.json'),
      JSON.stringify({
        extends: '@nocobase/dev-config/tsconfig/server-library.json',
        compilerOptions: {
          outDir: './server-declarations',
        },
        include: ['database/**/*.ts', 'routes.ts'],
      }),
    );
    execFileSync(
      process.execPath,
      [
        templateRequire.resolve('typescript/bin/tsc'),
        '-p',
        path.join(appRoot, 'tsconfig.server.json'),
        '--emitDeclarationOnly',
      ],
      { cwd: appRoot, encoding: 'utf8', stdio: 'inherit' },
    );
    const runner = readFileSync(
      path.join(packageRoot, 'tests/fixtures/agent-workflow-runner.ts'),
      'utf8',
    );
    writeFileSync(path.join(appRoot, 'run.ts'), runner);
    const output = execFileSync(
      process.execPath,
      ['--import', require.resolve('tsx'), path.join(appRoot, 'run.ts')],
      { cwd: appRoot, encoding: 'utf8' },
    );
    expect(output).toContain('Agent workflow passed');
  } finally {
    rmSync(appRoot, { force: true, recursive: true });
  }
}, 90_000);
