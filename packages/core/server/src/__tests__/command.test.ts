import { mockDatabase } from '@nocobase/database';
import Application, { ApplicationOptions } from '../application';

const mockServer = (options?: ApplicationOptions) => {
  return new Application({
    database: mockDatabase(),
    acl: false,
    ...options,
  });
};

describe('command', () => {
  let app: Application;

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  test('case1', async () => {
    app = mockServer({
      plugins: [],
    });

    let val;

    app
      .command('c1')
      // .option('-p, --pepper')
      .option('-r1, --retry1 [retry1]')
      .option('-r2, --retry2 [retry2]')
      .option('-r3, --retry3 [retry3]')
      .action((opts, cli) => {
        val = opts;
      });

    await app.runCommand('c1', '-r1', '2');
    expect(val).toEqual({ retry1: '2' });
    await app.runCommand('c1', '-r2', '3');
    expect(val).toEqual({ retry2: '3' });
    await app.runCommand('c1', '-r3', '4');
    expect(val).toEqual({ retry3: '4' });
  });

  test('case2', async () => {
    app = mockServer({
      plugins: [],
    });

    let val;

    app
      .command('c1')
      // .option('-p, --pepper')
      .option('-r1, --retry1 [retry1]', '', '1')
      .option('-r2, --retry2 [retry2]', '', '2')
      .option('-r3, --retry3 [retry3]', '', '3')
      .action((opts, cli) => {
        val = opts;
      });

    await app.runCommand('c1', '-r1', '2');
    expect(val).toEqual({ retry1: '2', retry2: '2', retry3: '3' });
    await app.runCommand('c1', '-r2', '3');
    expect(val).toEqual({ retry1: '1', retry2: '3', retry3: '3' });
    await app.runCommand('c1', '-r3', '4');
    expect(val).toEqual({ retry1: '1', retry2: '2', retry3: '4' });
  });
});
