import { join, basename } from 'path';
import { existsSync, readdirSync, renameSync, statSync } from 'fs';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import build from './build';

function moveEsLibToDist(cwd) {
  ['es', 'lib'].forEach(dir => {
    const absDirPath = join(cwd, dir);
    const absDistPath = join(cwd, 'dist');
    if (existsSync(absDirPath)) {
      mkdirp.sync(absDistPath);
      renameSync(absDirPath, join(absDistPath, dir));
    }
  });
}

describe('father build', () => {
  const rootConfigMapping = {
    'lerna-root-config-override': { cjs: 'rollup', esm: false },
  };

  require('test-build-result')({
    root: join(__dirname, './fixtures/build'),
    build({ cwd }) {
      process.chdir(cwd);
      rimraf.sync(join(cwd, 'dist'));
      return build({ cwd, rootConfig: rootConfigMapping[basename(cwd)] }).then(() => {
        // babel
        moveEsLibToDist(cwd);

        // lerna
        if (existsSync(join(cwd, 'lerna.json'))) {
          mkdirp.sync(join(cwd, 'dist'));
          const pkgs = readdirSync(join(cwd, 'packages'));
          for (let pkg of pkgs) {
            // TODO: hard code
            if (pkg === '@hoo') {
              pkg = '@hoo/bar';
            }
            const pkgPath = join(cwd, 'packages', pkg);
            if (!statSync(pkgPath).isDirectory()) continue;
            moveEsLibToDist(pkgPath);
            renameSync(
              join(pkgPath, 'dist'),
              // @foo/bar -> bar
              join(cwd, 'dist', pkg.split('/').slice(-1).join(''))
            );
          }
        }
      });
    },
  });
});
