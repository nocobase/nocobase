import { mockDatabase } from '../';
import { Database } from '../../database';

describe('text field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create text field type', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'text',
          name: 'text1',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text2',
          length: 'tiny',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text3',
          length: 'medium',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text4',
          length: 'long',
          defaultValue: 'a',
        },
      ],
    });
    await Test.sync();
  });
});
