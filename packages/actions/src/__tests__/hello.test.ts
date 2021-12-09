import { mockServer } from '.';

async function test(ctx, next) {
  ctx.body = ctx.action.params;
  await next();
}

describe('hello', () => {
  it('hello', async () => {
    const app = mockServer();

    app.collection({
      name: 'tests',
    });

    app.actions({ test });

    const response = await app.agent().resource('tests').test({ key1: 'val1' });
    expect(response.body.key1).toBe('val1');
    await app.destroy();
  });
});
