import { CollectionData } from '../hooks/useDumpableCollections';
import { getCategories } from '../utils/getCategories';

describe('getCategories', () => {
  test('should return categories', () => {
    const list: CollectionData[] = [
      {
        key: 'directus_files',
        name: 'directus_files',
        title: 'Files',
        inherits: ['directus_files'],
        fields: [],
        category: [
          {
            name: 'Files',
            color: '#FFD166',
            sort: 1,
          },
          {
            name: 'Files_1',
            color: '#FFD166',
            sort: 1,
          },
        ],
      },
      {
        key: 'directus_files_1',
        name: 'directus_files_1',
        title: 'Files_1',
        inherits: ['directus_files'],
        fields: [],
        category: [
          {
            name: 'Files_1',
            color: '#FFD166',
            sort: 1,
          },
          {
            name: 'Files_2',
            color: '#FFD166',
            sort: 1,
          },
        ],
      },
    ];

    expect(getCategories(list)).toEqual(['Files', 'Files_1', 'Files_2']);
  });
});
