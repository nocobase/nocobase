import { StringValueParser } from '../../value-parsers';

describe('array value parser', () => {
  let parser: StringValueParser;

  beforeEach(() => {
    parser = new StringValueParser({}, {});
  });

  const expectValue = (value) => {
    parser = new StringValueParser({}, {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  test('string value parser', async () => {
    expectValue('{"a":1}').toEqual('{"a":1}');
    expectValue('{"a":1,"b":2}').toEqual('{"a":1,"b":2}');
    expectValue('{"a":1,"b":2,"c":3}').toEqual('{"a":1,"b":2,"c":3}');
  });
});
