import { useContext } from 'react';
import { SchemaComponentContext, SchemaComponentChangelessContext } from '../context';

export function useSchemaComponentContext() {
  return useContext(SchemaComponentContext);
}

export function useSchemaComponentChangelessContext() {
  return useContext(SchemaComponentChangelessContext);
}
