import { transformValue } from '../../hooks/useSpecialCase';

describe('transformValue', () => {
  it('value is an array', () => {
    const value = [{ a: 3 }, { a: 4 }];
    const deps = {
      field: {
        value: [{ a: 1, b: 11 }],
      },
      subFieldSchema: {
        name: 'a',
      },
    };

    expect(transformValue(value, deps as any)).toMatchInlineSnapshot(`
      [
        {
          "a": {
            "a": 3,
          },
          "b": 11,
        },
        {
          "__notFromDatabase": true,
          "a": {
            "a": 4,
          },
          "b": 11,
        },
      ]
    `);
  });
});
