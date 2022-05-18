import { ModuleFormat, rollup, watch } from 'rollup';
import signale from 'signale';
import chalk from 'chalk';
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
      await (new Promise<void>((resolve) => {
        watcher.on('event', (event) => {
          // 每次构建完成都会触发 BUNDLE_END 事件
          // 当第一次构建完成或出错就 resolve
          if (event.code === 'ERROR') {
            signale.error(event.error);
            resolve();
          } else if (event.code === 'BUNDLE_END') {
            log(`${chalk.green(`Build ${type} success`)} ${chalk.gray(`entry: ${entry}`)}`);
            resolve();
          }
        });
      }));
      process.once('SIGINT', () => {
        watcher.close();
      });
      dispose?.push(() => watcher.close());
    } else {
      const { output, ...input } = rollupConfig;
      const bundle = await rollup(input); // eslint-disable-line
      await bundle.write(output); // eslint-disable-line
      log(`${chalk.green(`Build ${type} success`)} ${chalk.gray(`entry: ${entry}`)}`);
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
  if (opts.watch) {
    opts.log(chalk.magentaBright(`Rebuild ${opts.type} since file changed 👀`));
  }
}
