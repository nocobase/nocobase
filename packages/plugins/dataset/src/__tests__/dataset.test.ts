import { uid } from '@formily/shared';
import JSON5 from 'json5';

describe('dataset', () => {
  it('should', () => {
    const a = 10;
    expect(a).toBe(10);
  });

  it('parse mockData String to obj', () => {
    const mockData = "[{ id1: 1, name: 'Name1' },{ id1: 2, name: 'Name2' },{ id1: 3, name: 'Name3' },]";
    const mockDataArray = JSON5.parse(mockData);
    if (mockData) {
      if (Array.isArray(mockDataArray)) {
        if (
          mockDataArray.every((item) => {
            return typeof item === 'object' && Object.keys(item).length > 1;
          })
        )
          mockDataArray.map((item) => {
            if (!item?.id) {
              item.id = uid();
            }
            return item;
          });
      }
    }
    expect(mockDataArray).toMatchInlineSnapshot(`
      Array [
        Object {
          "id": "c18rc15vult",
          "id1": 1,
          "name": "Name1",
        },
        Object {
          "id": "g1lyd1naotk",
          "id1": 2,
          "name": "Name2",
        },
        Object {
          "id": "x5n0hki33kl",
          "id1": 3,
          "name": "Name3",
        },
      ]
    `);
  });
  it('test json5', function () {
    const mockData = "[{ id: 1, name: 'Name1' },{ id: 2, name: 'Name2' },{ id: 3, name: 'Name3' },]";
    const result = JSON5.parse(mockData);
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "id": 1,
          "name": "Name1",
        },
        Object {
          "id": 2,
          "name": "Name2",
        },
        Object {
          "id": 3,
          "name": "Name3",
        },
      ]
    `);
  });
});
