import type { ISchema } from '@formily/react';
import { useFieldSchema } from '@formily/react';

export function getSchemaPath(schema: ISchema) {
  const path = schema['x-path'] || [schema.name];
  let parent = schema['x-parent'];
  while (parent) {
    // if (!parent.name) {
    //   break;
    // }
    if (parent['x-path']) {
      path.unshift(...parent['x-path']);
    } else if (parent.name) {
      path.unshift(parent.name);
    }
    parent = parent.parent;
  }
  // console.log('getSchemaPath', path, schema);
  return [...path];
}

export function useSchemaPath() {
  const schema = useFieldSchema();
  const path = getSchemaPath(schema);
  return [...path];
}
