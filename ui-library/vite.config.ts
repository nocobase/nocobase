import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

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
    ],
  },
});
