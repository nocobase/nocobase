import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = import.meta.dirname;
const repository = path.resolve(root, '../../../../../..');
// Use installed template tooling; no fixture manifest, dependency install or source aliases.
const require = createRequire(
  path.join(repository, 'packages/templates/app-template-default/package.json'),
);
const load = async (name) => import(pathToFileURL(require.resolve(name)).href);
const { build } = await load('vite');
const { default: react } = await load('@vitejs/plugin-react');
const { default: tailwindcss } = await load('@tailwindcss/vite');
await build({
  configFile: false,
  root,
  base: '/main/',
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      'react-router',
      '@nocobase/app-client',
      '@nocobase/service-provider',
      '@nocobase/i18n',
    ],
    alias: [
      {
        find: /^tailwindcss$/,
        replacement: require.resolve('tailwindcss/index.css'),
      },
      {
        find: /^tw-animate-css$/,
        replacement: path.join(
          repository,
          'packages/templates/app-template-default/node_modules/tw-animate-css/dist/tw-animate.css',
        ),
      },
      {
        find: /^shadcn\/tailwind.css$/,
        replacement: require.resolve('shadcn/tailwind.css'),
      },
    ],
  },
  build: {
    target: 'esnext',
    outDir: path.join(repository, '.tmp/mail-issue7-browser/dist'),
    emptyOutDir: true,
  },
});
