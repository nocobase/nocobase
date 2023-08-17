import path from 'path';
import { build } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import react from '@vitejs/plugin-react';
import { PkgLog } from './utils';

export function buildClient(cwd: string, sourcemap: boolean = false, log: PkgLog) {
  log('build client');

  return Promise.all([viteBuild(cwd, sourcemap, 'cjs'), viteBuild(cwd, sourcemap, 'es')]);
}

export function viteBuild(cwd: string, sourcemap: boolean, format: 'cjs' | 'es') {
  const outDir = path.resolve(cwd, format === 'cjs' ? 'lib' : 'es');
  const entry = path.join(cwd, 'src/index.ts').replaceAll(/\\/g, '/');
  const cwdWin = cwd.replaceAll(/\\/g, '/');
  const cwdUnix = cwd.replaceAll(/\//g, '\\');

  return build({
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      minify: false,
      outDir,
      cssCodeSplit: true,
      emptyOutDir: true,
      sourcemap,
      lib: {
        entry,
        formats: [format],
        fileName: 'index',
      },
      target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      rollupOptions: {
        cache: true,
        treeshake: true,
        external(id) {
          if (id.startsWith('.') || id.startsWith(cwdUnix) || id.startsWith(cwdWin)) {
            return false;
          }
          return true;
        },
      },
    },
    plugins: [react(), libInjectCss()],
  });
}
