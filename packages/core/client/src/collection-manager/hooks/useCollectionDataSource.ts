import { action } from '@formily/reactive';

import { useCollectionManager } from ".";
import { useCompile } from "../../schema-component";

export function useCollectionDataSource(filter?: Function) {
  return (field: any) => {
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    action.bound((data: any) => {
      const filtered = typeof filter === 'function' ? data.filter(filter) : data;
      field.dataSource = filtered.map(item => ({
        label: compile(item.title),
        value: item.name
      }));
    })(collections);
  }
}
