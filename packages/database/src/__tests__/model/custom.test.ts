import { registerModels } from '../..';
import { getDatabase } from '../';
import Model from '../../model';

describe('custom model', () => {
  it('custom model', async () => {
    class BaseModel extends Model {};
    const database = getDatabase();
    registerModels({BaseModel});
    database.table({
      name: 'tests',
      model: 'BaseModel',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    });
    await database.sync();
    await database.close();
  });
});
