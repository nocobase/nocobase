import { DataTypes, mockDatabase } from '@nocobase/database';
import Application, { ApplicationOptions } from '../application';

const mockServer = (options?: ApplicationOptions) => {
  return new Application({
    database: mockDatabase(),
    acl: false,
    ...options,
  });
};

describe('app command', () => {
  let app: Application;

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  beforeEach(async () => {
    app = mockServer();
    await app.load();
    await app.install();
  });

  it('should get command', () => {
    app.command('test');

    app.cli.findCommand(['test'], {
      from: 'user',
    });
  });
});
