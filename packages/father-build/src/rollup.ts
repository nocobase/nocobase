import { ModuleFormat, rollup, watch } from 'rollup';
import signale from 'signale';
import getRollupConfig from './getRollupConfig';
import { Dispose, IBundleOptions } from './types';
import normalizeBundleOpts from './normalizeBundleOpts';

interface IRollupOpts {
  cwd: string;
  rootPath?: string;
  entry: string | string[];
  type: ModuleFormat;
  log: (string) => void;
  bundleOpts: IBundleOptions;
  watch?: boolean;
  dispose?: Dispose[];
  importLibToEs?: boolean;
}

async function build(entry: string, opts: IRollupOpts) {
  const { cwd, rootPath, type, log, bundleOpts, importLibToEs, dispose } = opts;
  const rollupConfigs = getRollupConfig({
    cwd,
    rootPath:rootPath || cwd,
    type,
    entry,
    importLibToEs,
    bundleOpts: normalizeBundleOpts(entry, bundleOpts),
  });

  for (const rollupConfig of rollupConfigs) {
    if (opts.watch) {
      const watcher = watch([
        {
          ...rollupConfig,
          watch: {},
        },
      ]);
      watcher.on('event', event => {
        if (event.error) {
          signale.error(event.error);
        } else if (event.code === 'START') {
          log(`[${type}] Rebuild since file changed`);
        }
      });
      process.once('SIGINT', () => {
        watcher.close();
      });
      dispose?.push(() => watcher.close());
    } else {
      const { output, ...input } = rollupConfig;
      const bundle = await rollup(input); // eslint-disable-line
      await bundle.write(output); // eslint-disable-line
    }
  }
}

export default async function(opts: IRollupOpts) {
  if (Array.isArray(opts.entry)) {
    const { entry: entries } = opts;
    for (const entry of entries) {
      await build(entry, opts);
    }
  } else {
    await build(opts.entry, opts);
  }
}
