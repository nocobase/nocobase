import { action } from '@formily/reactive';

import { useCompile } from '../../schema-component';
import { useCollectionManagerV2 } from '../../application';

export function useCollectionDataSource(filter?: Function) {
  const compile = useCompile();
  const collectionManager = useCollectionManagerV2();
  return (field: any) => {
    action.bound((data: any) => {
      const filtered = typeof filter === 'function' ? data.filter(filter) : data;
      field.dataSource = filtered.map((item) => ({
        label: compile(item.title),
        value: item.name,
      }));
    })(collectionManager.getCollections());
  };
}
