import { createCollapseBlockSchema } from '../createFilterCollapseBlockSchema';

vi.mock('@formily/shared', () => ({
  uid: vi.fn().mockReturnValue('mocked-uid'),
}));

describe('createCollapseBlockSchema', () => {
  it('should return the correct schema', () => {
    const options = {
      collectionName: 'testCollection',
      dataSource: 'testDataSource',
      blockType: 'testBlockType',
    };

    const schema = createCollapseBlockSchema(options);

    expect(schema).toEqual({
      type: 'void',
      'x-decorator': 'AssociationFilter.Provider',
      'x-use-decorator-props': 'useCollapseBlockDecoratorProps',
      'x-decorator-props': {
        collection: 'testCollection',
        dataSource: 'testDataSource',
        blockType: 'testBlockType',
        associationFilterStyle: {
          width: '100%',
        },
        name: 'filter-collapse',
      },
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:filterCollapse',
      'x-component': 'CardItem',
      'x-filter-targets': [],
      properties: {
        'mocked-uid': {
          type: 'void',
          'x-action': 'associateFilter',
          'x-initializer': 'filterCollapse:configureFields',
          'x-component': 'AssociationFilter',
        },
      },
    });
  });
});
