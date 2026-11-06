import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Run from an installed application. Resolve tooling versions before creating anything.
const root = process.cwd();
const tooling = [
  '@nocobase/dev-config',
  '@types/node',
  'typescript',
  'eslint',
  'prettier',
  'vitest',
];
const devDependencies = Object.fromEntries(
  tooling.map((name) => {
    const manifest = JSON.parse(
      readFileSync(
        path.join(root, 'node_modules', name, 'package.json'),
        'utf8',
      ),
    );
    return [name, manifest.version];
  }),
);
const directory = path.join(root, 'packages/shared');
mkdirSync(path.dirname(directory), { recursive: true });
// Refuse to replace an existing package, even an empty directory.
mkdirSync(directory);
const files = {
  'package.json': {
    name: '@my-app/shared',
    version: '0.0.1',
    private: true,
    type: 'module',
    files: ['dist'],
    exports: { '.': { types: './dist/index.d.ts', import: './src/index.ts' } },
    publishConfig: {
      exports: {
        '.': { types: './dist/index.d.ts', import: './dist/index.js' },
      },
    },
    prettier: '@nocobase/dev-config/prettier',
    scripts: {
      build: 'tsc -p tsconfig.json',
      'dev:types':
        'tsc -p tsconfig.json --emitDeclarationOnly --watch --preserveWatchOutput',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      lint: 'eslint . --max-warnings 0',
      'lint:fix': 'eslint . --fix --max-warnings 0',
      format: 'prettier . --write',
      'format:check': 'prettier . --check',
      test: 'vitest run',
      check:
        'pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build',
      fix: 'pnpm lint:fix && pnpm format',
    },
    devDependencies,
  },
  'tsconfig.json': {
    extends: '@nocobase/dev-config/tsconfig/server-library.json',
    compilerOptions: { rootDir: 'src', outDir: 'dist' },
    include: ['src'],
  },
  'eslint.config.js':
    "import { createNodeLibraryConfig } from '@nocobase/dev-config/eslint';\nexport default createNodeLibraryConfig();\n",
  'vitest.config.ts':
    "import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';\nexport default createNodeVitestConfig();\n",
  '.prettierignore': 'dist/\nnode_modules/\ncoverage/\n',
  '.gitignore': 'dist/\nnode_modules/\ncoverage/\n',
  'src/index.ts':
    'export interface Greeting {\n  message: string;\n}\n\nexport function greet(name: string): Greeting {\n  return { message: `Hello, ${name}!` };\n}\n',
  'tests/greet.test.ts':
    "import { expect, it } from 'vitest';\nimport { greet } from '../src/index.ts';\n\nit('greets the requested person', () => {\n  expect(greet('Ada')).toEqual({ message: 'Hello, Ada!' });\n});\n",
};
for (const [relative, contents] of Object.entries(files)) {
  const file = path.join(directory, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(
    file,
    typeof contents === 'string'
      ? contents
      : `${JSON.stringify(contents, null, 2)}\n`,
  );
}
console.log(
  'Created packages/shared. Add @my-app/shared: workspace:* to the application dependencies, then run pnpm install and pnpm --filter @my-app/shared fix.',
);
