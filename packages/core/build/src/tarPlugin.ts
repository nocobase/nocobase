import path from 'path';
import tar from 'tar';
import fg from 'fast-glob';
import fs from 'fs-extra';

import { PkgLog } from "./utils";
import { TAR_OUTPUT_DIR, tarIncludesFiles } from './constant'

export function tarPlugin(cwd: string, log: PkgLog) {
  log('tar package');
  const pkg = require(path.join(cwd, 'package.json'));
  const npmIgnore = path.join(cwd, '.npmignore');
  let files = pkg.files || [];
  if (fs.existsSync(npmIgnore)) {
    files = fs.readFileSync(npmIgnore, 'utf-8').split('\n').filter((item) => item.trim()).map(item => `!${item}`);
    files.push('**/*');
  }

  // 必须包含的文件
  files.push(...tarIncludesFiles);

  files = files.map((item: string) => item !== '**/*' && fs.existsSync(path.join(cwd, item.replace('!', ''))) && fs.statSync(path.join(cwd, item.replace('!', ''))).isDirectory() ? `${item}/**/*` : item);

  const tarball = path.join(TAR_OUTPUT_DIR, `${pkg.name}-${pkg.version}.tgz`);
  const tarFiles = fg.sync(files, { cwd });

  fs.mkdirpSync(path.dirname(tarball));
  return tar.c({ gzip: true, file: tarball, cwd }, tarFiles);
}
