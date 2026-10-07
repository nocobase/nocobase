import { defineConfig, type Alias, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

interface RegistryItem {
  readonly type: string;
  readonly files: readonly { readonly path: string; readonly target: string }[];
}

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/**
 * Every file an item installs, imported the way an application imports it after `shadcn add` (`@/` and its target
 * without `client/` and the extension), resolved to its source, so the demos read exactly like the examples published
 * from them. Example items are left out: nothing imports them.
 */
export function installedItemAliases(): Alias[] {
  const index = JSON.parse(
    readFileSync(path.resolve(__dirname, 'registry.json'), 'utf8'),
  ) as { include: string[] };
  return index.include.flatMap((include) => {
    const file = path.resolve(__dirname, include);
    const { items } = JSON.parse(readFileSync(file, 'utf8')) as {
      items: RegistryItem[];
    };
    return items
      .filter((item) => item.type !== 'registry:example')
      .flatMap((item) => item.files)
      .map((entry) => ({
        find: new RegExp(
          `^${escapeRegExp(`@/${entry.target.replace(/^client\//u, '').replace(/\.tsx?$/u, '')}`)}(?:\\.js)?$`,
          'u',
        ),
        replacement: path.resolve(path.dirname(file), entry.path),
      }));
  });
}

export default defineConfig({
  plugins: [react(), tailwindcss() as unknown as PluginOption],
  resolve: {
    alias: [
      // The device-approval block calls the authentication plugin's client, which needs a server; the demo answers in
      // its place.
      {
        find: /^@nocobase\/app-plugin-authentication\/client$/,
        replacement: path.resolve(
          __dirname,
          './website/demo/auth/authentication-client.ts',
        ),
      },
      // The agent-chat block reads the agents plugin's chat hooks, which need a server; the demo keeps the
      // conversations in memory in their place.
      {
        find: /^@nocobase\/app-plugin-agents\/client\/chat$/,
        replacement: path.resolve(
          __dirname,
          './website/demo/agents/agents-chat-client.tsx',
        ),
      },
      // The inbox block reads the in-app notification plugin's hooks and the application client, which need a server
      // and an application; the inbox demos answer from memory in their place.
      {
        find: /^@nocobase\/app-plugin-notification-in-app\/client\/inbox$/,
        replacement: path.resolve(
          __dirname,
          './website/demo/inbox/notification-in-app-inbox.ts',
        ),
      },
      // The plan-card block reads and acts on plans through the projects plugin's hooks, which need a server; the demo
      // keeps sample plans in memory in their place.
      {
        find: /^@nocobase\/app-plugin-projects\/client\/kit$/,
        replacement: path.resolve(
          __dirname,
          './website/demo/projects/projects-plan-kit.ts',
        ),
      },
      {
        find: /^@nocobase\/app-client$/,
        replacement: path.resolve(
          __dirname,
          './website/demo/inbox/app-client.ts',
        ),
      },
      ...installedItemAliases(),
      { find: '@', replacement: path.resolve(__dirname, './website') },
    ],
  },
});
