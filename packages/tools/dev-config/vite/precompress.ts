import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, constants, gzip } from 'node:zlib';
import type { Plugin } from 'vite';

const brotli = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

// Text the application server serves from `assets/`. Source maps are left out: browsers fetch them only with the
// developer tools open, and compressing them would slow every build for nothing users download.
const COMPRESSIBLE_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.json',
  '.mjs',
  '.svg',
  '.txt',
  '.wasm',
]);

// Below this size the encoding headers cost about as much as compression saves.
const MIN_SIZE = 1024;

export const isPrecompressible = (fileName: string, size: number): boolean =>
  size >= MIN_SIZE &&
  COMPRESSIBLE_EXTENSIONS.has(path.extname(fileName).toLowerCase());

/**
 * Writes a Brotli (`.br`) and a gzip (`.gz`) copy beside every compressible text file of a build, so the application
 * server answers `Accept-Encoding` with a file instead of compressing each response. Files are compressed once, at the
 * highest levels, because assets are immutable and served for a year. A copy that is not smaller is not written.
 */
export function precompressAssets(): Plugin {
  return {
    name: 'nocobase:precompress-assets',
    apply: 'build',
    async writeBundle(options, bundle) {
      const outDir = options.dir;
      if (!outDir) return;
      await Promise.all(
        Object.values(bundle).map(async (item) => {
          const content =
            item.type === 'chunk'
              ? Buffer.from(item.code)
              : Buffer.from(
                  typeof item.source === 'string'
                    ? item.source
                    : Buffer.from(item.source),
                );
          if (!isPrecompressible(item.fileName, content.byteLength)) return;
          const filePath = path.join(outDir, item.fileName);
          // Later plugins may rewrite the emitted file; compress what is on disk.
          const written = await readFile(filePath).catch(() => content);
          const [br, gz] = await Promise.all([
            brotli(written, {
              params: {
                [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
                [constants.BROTLI_PARAM_SIZE_HINT]: written.byteLength,
              },
            }),
            gzipAsync(written, { level: constants.Z_BEST_COMPRESSION }),
          ]);
          await Promise.all([
            br.byteLength < written.byteLength
              ? writeFile(`${filePath}.br`, br)
              : undefined,
            gz.byteLength < written.byteLength
              ? writeFile(`${filePath}.gz`, gz)
              : undefined,
          ]);
        }),
      );
    },
  };
}
