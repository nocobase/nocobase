import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export async function startRegistryHost() {
  const root = path.resolve(import.meta.dirname, '../..');
  const server = await createServer({
    configFile: false,
    root: import.meta.dirname,
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router'],
      alias: {
        '#components/agent-composer': path.join(
          root,
          'registry/agents/agent-composer.tsx',
        ),
        '#components/agent-picker': path.join(
          root,
          'registry/agents/agent-picker.tsx',
        ),
        '#components/agent-run-history': path.join(
          root,
          'registry/agents/agent-run-history.tsx',
        ),
        '#components/attachment-list': path.join(
          root,
          'registry/components/attachment-list.tsx',
        ),
        '#components/ui': path.join(root, 'website/components/ui'),
        '#hooks': path.join(root, 'website/hooks'),
        '#lib': path.join(root, 'website/lib'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 0,
      fs: { allow: [path.resolve(root, '..')] },
    },
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing Registry listener.');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => server.close(),
  };
}
