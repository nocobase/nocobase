import { action } from '@formily/reactive';

import { useCollectionManager } from ".";
import { useCompile } from "../../schema-component";

export function useCollectionDataSource() {
  return (field: any) => {
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    action.bound((data: any) => {
      field.dataSource = data.map(item => ({
        label: compile(item.title),
        value: item.name
      }));
    })(collections);
  }
}
