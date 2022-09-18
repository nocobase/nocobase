import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('field defaultValue', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test1',
        },
      });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be updated', async () => {
    await app
      .agent()
      .resource('collections.fields', 'test1')
      .create({
        values: {
          name: 'field1',
          type: 'string',
          defaultValue: 'abc',
        },
      });
    const response1 = await app.agent().resource('test1').create();
    expect(response1.body.data.field1).toBe('abc');
    await app
      .agent()
      .resource('collections.fields', 'test1')
      .update({
        filterByTk: 'field1',
        values: {
          type: 'string',
          defaultValue: 'cba',
        },
      });
      const response2 = await app.agent().resource('test1').create();
      expect(response2.body.data.field1).toBe('cba');
  });
});
