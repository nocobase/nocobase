import { transformValue } from '../../hooks/useSpecialCase';

describe('transformValue', () => {
  it('value is an array', () => {
    const value = [{ a: 1 }, { b: 1 }];
    const deps = {
      field: {
        value: [{ a: 2 }, { b: 2 }],
      },
      subFieldSchema: {
        name: 'a',
      },
    };

    expect(transformValue(value, deps as any)).toMatchInlineSnapshot(`
      [
        {
          "a": {
            "a": 1,
          },
        },
        {
          "a": {
            "b": 1,
          },
          "b": 2,
        },
      ]
    `);
  });
});
