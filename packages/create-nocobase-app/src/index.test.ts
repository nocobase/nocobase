import { rimraf } from '@umijs/utils';
import { existsSync } from 'fs';
import { join } from 'path';
import runGenerator from './index';

const fixtures = join(__dirname, 'fixtures');
const cwd = join(fixtures, 'generate');

test('generate app', async () => {
  await runGenerator({
    cwd,
    args: {
      _: [],
      $0: '',
    },
  });
  expect(existsSync(join(cwd, 'src', 'pages', 'index.tsx'))).toEqual(true);
  rimraf.sync(cwd);
});
