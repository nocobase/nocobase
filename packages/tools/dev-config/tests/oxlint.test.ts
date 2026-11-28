import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint, type Linter } from 'eslint';
import type { DummyRuleMap } from 'oxlint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApplicationConfig as createLegacyConfig } from '../eslint/index.ts';
import { createApplicationConfig } from '../oxlint/index.ts';

const require = createRequire(import.meta.url);
const oxlintBin = path.join(
  path.dirname(require.resolve('oxlint/package.json')),
  'bin/oxlint',
);
const requireTsgolint = createRequire(
  require.resolve('oxlint-tsgolint/package.json'),
);
const extension = process.platform === 'win32' ? '.exe' : '';
const backend = requireTsgolint.resolve(
  `@oxlint-tsgolint/${process.platform}-${process.arch}/tsgolint${extension}`,
);
let allDiagnostics: Diagnostic[];
const root = mkdtempSync(path.join(os.tmpdir(), 'nocobase-oxlint-'));
const config = createApplicationConfig({
  nodeTestFiles: ['scripts/checks/**/*.test.mjs'],
});

function write(file: string, source: string) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, source);
}

interface Diagnostic {
  code: string;
  filename: string;
  message: string;
  help?: string;
}

function lint(...paths: string[]) {
  const result = spawnSync(
    process.execPath,
    [
      oxlintBin,
      '--threads=2',
      '--type-aware',
      '--deny-warnings',
      '--format',
      'json',
      ...paths,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, OXLINT_TSGOLINT_PATH: backend },
    },
  );
  expect(result.error).toBeUndefined();
  expect(
    result.signal,
    'Oxlint terminated before reporting diagnostics',
  ).toBeNull();
  expect(result.stderr).toBe('');
  expect(result.stdout).toMatch(/^\{\s*"diagnostics"/);
  const { diagnostics } = JSON.parse(result.stdout) as {
    diagnostics: Diagnostic[];
  };
  return { status: result.status, diagnostics };
}

const command = `
import { app } from '@nocobase/app-server/node';
export class Command {
  async run() {
    const { makeApp } = await import('@nocobase/app-server/node');
    console.log(process.cwd(), app, makeApp);
    this.exit(1);
    this.logJson({});
  }
}
`;
const chart = `
const payload = JSON.parse('{}');
const colorName = (value: string) => value;
export const color = \`\${colorName(payload.color)} \${{ tone: 'blue' }}\`;
`;
const indexedKeys = `
export const Rows = ({ rows }) => rows.map((row, index) => <span key={index}>{row}</span>);
`;
const nodeTest = `
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('uses Node tests', () => assert.ok(true));
`;

beforeAll(() => {
  // The source rule module is the same one that the package compiles to dist.
  config.jsPlugins = [
    {
      name: 'nocobase',
      specifier: fileURLToPath(
        new URL('../oxlint/eslint-rules.ts', import.meta.url),
      ),
    },
  ];
  write('.oxlintrc.json', JSON.stringify(config));
  write(
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: { strict: true, target: 'ES2024', jsx: 'preserve' },
    }),
  );
  write(
    'client/env.jsx',
    `
export const prod = import.meta.env.PROD;
export const assets = import.meta.env?.BASE_URL;
export const unexpected = import.meta.env.FOO;
export const optional = import.meta.env?.CDN_BASE_URL;
export const unsafe = () => [
  crypto.randomUUID(),
  globalThis.crypto.randomUUID(),
  crypto['randomUUID'](),
  crypto?.randomUUID?.(),
  navigator.clipboard.writeText('text'),
  navigator.clipboard?.writeText('text'),
  globalThis.navigator.clipboard?.writeText('text'),
  navigator['clipboard'].writeText('text'),
];
`,
  );
  write('cli/commands/sync.mjs', command);
  write('server/sync.mjs', command);
  write('tests/cli/sync.test.js', command);
  write('server/unhandled.ts', 'Promise.resolve(1);\n');
  write(
    'server/suppressed.ts',
    `
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Exercise the legacy rule name.
    Promise.resolve(1);
  `,
  );
  write('client/components/chart.tsx', chart);
  write('client/components/ui/chart.tsx', chart);
  write('client/components/ui/nested/chart.tsx', chart);
  write('client/components/ui/rows.jsx', indexedKeys);
  write(
    'client/components/ui/rows.tsx',
    indexedKeys.replace('({ rows })', '({ rows }: { rows: string[] })'),
  );
  write(
    'jsx.d.ts',
    `
    declare namespace JSX {
      interface Element { readonly jsx: true }
      interface IntrinsicElements { span: { key?: number; children?: string } }
    }
  `,
  );
  write('client/components/rows.jsx', indexedKeys);
  write(
    'client/components/suppressed.jsx',
    `
    /* eslint-disable @eslint-react/no-array-index-key -- Exercise the legacy JS plugin name. */
    ${indexedKeys}
  `,
  );
  write(
    'tests/server/migration.test.ts',
    `
    import { expect } from 'vitest';
    import { describeMigration } from '@nocobase/app-testing/server';
    describeMigration('users', () => { expect(true).toBe(true); });
  `,
  );
  write('tests/build/assembly.test.mjs', nodeTest + '\ndebugger;\n');
  write('scripts/checks/health.test.mjs', nodeTest);
  write('tests/server/node.spec.js', nodeTest);
  write(
    'server/legacy.cjs',
    'function run(a, a) { return a + 001; }\nmodule.exports = run;\n',
  );
  for (const directory of [
    '.agents/skills',
    '.claude/worktrees',
    '.pnpm-store',
    'dist',
    'vendor',
  ]) {
    write(`${directory}/invalid.js`, 'debugger;\n');
  }
  allDiagnostics = lint().diagnostics;
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('Oxlint application preset', () => {
  it('uses the legacy custom diagnostics in browser source and application commands', () => {
    const diagnostics = allDiagnostics.filter(({ filename }) =>
      [
        'client/env.jsx',
        'cli/commands/sync.mjs',
        'server/sync.mjs',
        'tests/cli/sync.test.js',
      ].includes(filename),
    );
    const legacy = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: createLegacyConfig({ tsconfigRootDir: root }),
    });
    return legacy.lintFiles(['client/env.jsx', 'cli']).then((results) => {
      const expected = results
        .flatMap((file) => file.messages.map((message) => message.message))
        .sort();
      expect(expected).toHaveLength(16);
      expect(
        diagnostics
          .map(({ message, help }) => [message, help].filter(Boolean).join(' '))
          .sort(),
      ).toEqual(expected);
    });
  });

  it('enforces type-aware rules and accepts an existing TypeScript ESLint directive', () => {
    const diagnostics = allDiagnostics.filter(({ filename }) =>
      /^server\/.*\.ts$/u.test(filename),
    );
    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 'typescript(no-floating-promises)',
        filename: 'server/unhandled.ts',
      }),
    ]);
  });

  it('limits shadcn exceptions to the registry TSX files and the top-level chart', () => {
    const diagnostics = allDiagnostics.filter(({ filename }) =>
      filename.startsWith('client/components/'),
    );
    for (const rule of [
      'no-unsafe-assignment',
      'no-unsafe-member-access',
      'no-unsafe-argument',
      'restrict-template-expressions',
    ]) {
      expect(
        diagnostics
          .filter(({ code }) => code === `typescript(${rule})`)
          .map(({ filename }) => filename)
          .sort(),
      ).toEqual([
        'client/components/chart.tsx',
        'client/components/ui/nested/chart.tsx',
      ]);
    }
    expect(
      diagnostics
        .filter(({ code }) => code === '@eslint-react(no-array-index-key)')
        .map(({ filename }) => filename)
        .sort(),
    ).toEqual(['client/components/rows.jsx', 'client/components/ui/rows.jsx']);
    expect(
      diagnostics
        .filter(({ code }) => code === 'typescript(no-base-to-string)')
        .map(({ filename }) => filename)
        .sort(),
    ).toEqual([
      'client/components/chart.tsx',
      'client/components/ui/chart.tsx',
      'client/components/ui/nested/chart.tsx',
    ]);
    expect(diagnostics).toHaveLength(13);
  });

  it('keeps the Vitest exception narrow and still lints Node build tests', () => {
    const diagnostics = allDiagnostics.filter(
      ({ filename }) =>
        filename.startsWith('tests/') || filename.startsWith('scripts/checks/'),
    );
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'eslint(no-debugger)',
          filename: 'tests/build/assembly.test.mjs',
        }),
        expect.objectContaining({
          code: 'vitest(no-import-node-test)',
          filename: 'tests/server/node.spec.js',
        }),
      ]),
    );
    expect(diagnostics).toHaveLength(2);
  });

  it('ignores generated output, skills, worktrees, vendor and store directories', () => {
    expect(
      allDiagnostics.some(({ filename }) => filename.endsWith('/invalid.js')),
    ).toBe(false);
  });

  it('rejects duplicate parameters and octal literals in CommonJS', () => {
    expect(
      allDiagnostics
        .filter(({ filename }) => filename === 'server/legacy.cjs')
        .map(({ code }) => code)
        .sort(),
    ).toEqual(
      expect.arrayContaining(['nocobase(no-dupe-args)', 'nocobase(no-octal)']),
    );
  });

  it('fails lint when only an existing React warning is reported', () => {
    const { status, diagnostics } = lint('client/components/rows.jsx');
    expect(status).toBe(1);
    expect(diagnostics).toEqual([
      expect.objectContaining({ code: '@eslint-react(no-array-index-key)' }),
    ]);
  });
});

it('maps every active rule in the legacy application preset', async () => {
  const legacy = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: createLegacyConfig({ tsconfigRootDir: root }),
  });
  const overrides = config.overrides ?? [];
  const typescript = overrides.find(({ files }) =>
    files.includes('**/*.{ts,tsx,mts,cts}'),
  );
  const react = overrides.find(({ files }) =>
    files.includes('client/**/*.{js,jsx,ts,tsx}'),
  );
  const vitest = overrides.find(
    ({ rules }) => rules?.['vitest/no-standalone-expect'],
  );
  const cli = overrides.find(
    ({ rules }) => rules?.['nocobase/no-restricted-imports'],
  );
  const browserApis = overrides.find(({ files }) =>
    files.includes('{client,shared,registry}/**/*.{js,jsx,ts,tsx}'),
  );
  const mapLegacyName = (rule: string) => {
    if (
      [
        'no-restricted-syntax',
        'no-restricted-imports',
        'quotes',
        'jsx-quotes',
        'no-dupe-args',
        'no-octal',
      ].includes(rule)
    ) {
      return `nocobase/${rule}`;
    }
    if (
      /^@typescript-eslint\/no-(array-constructor|unused-expressions|unused-vars)$/.test(
        rule,
      )
    ) {
      return rule.slice(rule.indexOf('/') + 1);
    }
    return rule
      .replace(/^@typescript-eslint\//, 'typescript/')
      .replace(/^react-(?:hooks|refresh)\//, 'react/');
  };
  const cases: [string, DummyRuleMap][] = [
    ['server/sync.mjs', { ...config.rules }],
    ['server/unhandled.ts', { ...config.rules, ...typescript?.rules }],
    [
      'client/env.jsx',
      { ...config.rules, ...react?.rules, ...browserApis?.rules },
    ],
    [
      'tests/server/node.spec.js',
      { ...config.rules, ...react?.rules, ...vitest?.rules },
    ],
    ['cli/commands/sync.mjs', { ...config.rules, ...cli?.rules }],
  ];
  for (const [file, rules] of cases) {
    const previous: Linter.Config | undefined =
      await legacy.calculateConfigForFile(file);
    const active = previous?.rules ?? {};
    expect(Object.keys(active).length).toBeGreaterThan(50);
    for (const [name, entry] of Object.entries(active)) {
      const severity = Array.isArray(entry) ? entry[0] : entry;
      // Oxlint uses fixed compiler options and leaves gating disabled.
      if (
        severity === 0 ||
        name === 'react-hooks/config' ||
        name === 'react-hooks/gating'
      )
        continue;
      const configured = rules[mapLegacyName(name) as keyof DummyRuleMap];
      expect(
        Array.isArray(configured) ? configured[0] : configured,
        `${file}: ${name}`,
      ).toBe(severity === 2 ? 'error' : 'warn');
    }
  }
});
