import { action } from '@formily/reactive';

import { useCollectionManager } from '.';
import { useCompile } from '../../schema-component';

export function useCollectionDataSource(filter?: Function) {
  const compile = useCompile();
  const { collections = [] } = useCollectionManager();
  return (field: any) => {
    action.bound((data: any) => {
      const filtered = typeof filter === 'function' ? data.filter(filter) : data;
      field.dataSource = filtered.map((item) => ({
        label: compile(item.title),
        value: item.name,
      }));
    })(collections);
  };
}
