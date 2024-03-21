import { omitSomeFields } from '../e2e/e2eUtils';

describe('omitSomeFields', () => {
  test('should omit key & collectionName', () => {
    const collections = [
      {
        key: 'y7yd3v18l4t',
        name: 't_0a1w7khj0y7',
        title: 'a',
        inherit: false,
        hidden: false,
        description: null,
        fields: [
          {
            key: '1anm4syjvjt',
            name: 'id',
            type: 'bigInt',
            interface: 'id',
            description: null,
            collectionName: 't_0a1w7khj0y7',
            parentKey: null,
            reverseKey: null,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: {
              type: 'number',
              title: '{{t("ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
          },
        ],
      },
    ];

    expect(omitSomeFields(collections)).toMatchSnapshot();
  });
});
