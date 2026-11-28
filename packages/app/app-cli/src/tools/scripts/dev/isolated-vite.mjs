// Inline options take precedence over the application's Vite config, including its cacheDir and envDir.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { createServer } = await import(
  pathToFileURL(require.resolve('vite')).href
);
const server = await createServer({
  cacheDir: process.env.NOCOBASE_SCREENSHOT_VITE_CACHE,
  envDir: false,
  server: {
    host: process.env.APP_VITE_DEV_HOST,
    port: Number(process.env.APP_VITE_DEV_PORT),
    strictPort: true,
  },
});
await server.listen();
server.printUrls();
