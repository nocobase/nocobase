import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import glob from 'fast-glob';

function getTsconfigPaths() {
  const content = readFileSync(resolve(process.cwd(), 'tsconfig.paths.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.compilerOptions.paths;
}

function getPackagePaths() {
  const paths = getTsconfigPaths();
  const pkgs = [];
  for (const key in paths) {
    if (Object.hasOwnProperty.call(paths, key)) {
      for (const dir of paths[key]) {
        if (dir.includes('*')) {
          const files = glob.sync(dir, { cwd: process.cwd(), onlyDirectories: true });
          for (const file of files) {
            const dirname = resolve(process.cwd(), file);
            if (existsSync(dirname)) {
              const re = new RegExp(dir.replace('*', '(.+)'));
              const normalized = dirname
                .substring(process.cwd().length + 1)
                .split(sep)
                .join('/');
              const match = re.exec(normalized);
              pkgs.push([key.replace('*', match?.[1]), dirname]);
            }
          }
        } else {
          const dirname = resolve(process.cwd(), dir);
          pkgs.push([key, dirname]);
        }
      }
    }
  }
  return pkgs;
}

export function getRsbuildAlias() {
  return getPackagePaths().reduce((memo, item) => {
    memo[item[0]] = item[1];
    return memo;
  }, {});
}
