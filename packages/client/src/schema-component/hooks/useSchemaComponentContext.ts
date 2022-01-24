import { useContext } from 'react';
import { SchemaComponentContext } from '../context';

export function useSchemaComponentContext() {
  return useContext(SchemaComponentContext);
}
