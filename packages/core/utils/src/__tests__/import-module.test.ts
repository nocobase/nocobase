import path from 'path';
import { importModule } from '../requireModule';

describe('import module', () => {
  it('should import module with absolute path', async () => {
    const file = './test.ts';
    const filePath = path.resolve(__dirname, file);

    const m = await importModule(filePath);
    expect(m.test).toEqual('hello');
  });
});
