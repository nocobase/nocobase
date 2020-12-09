import { Agent, getAgent, getApp } from '../';
import { Application } from '@nocobase/server';
import * as types from '../../interfaces/types';
jest.setTimeout(30000);
import { FieldModel } from '../../models';
describe('models.field', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  it('updatedAt', async () => {
    const Field = app.database.getModel('fields');
    const field = new Field();
    field.setInterface('updatedAt');
    expect(field.get()).toMatchObject(types.updatedAt.options)
  });
});
