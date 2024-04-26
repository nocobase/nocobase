import { ArrayValueParser } from '@nocobase/database';

describe('array value parser', () => {
  let parser: ArrayValueParser;

  beforeEach(() => {
    parser = new ArrayValueParser({}, {});
  });

  const expectValue = (value) => {
    parser = new ArrayValueParser({}, {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  test('array value parser', async () => {
    expectValue('tag1').toEqual(['tag1']);
    expectValue('tag1,tag2').toEqual(['tag1', 'tag2']);
  });
});
