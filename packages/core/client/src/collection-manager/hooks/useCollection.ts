import { SchemaKey } from '@formily/react';
import { useAPIClient } from '../../api-client';
import { useCollectionV2 } from '../../application';
import { InheritanceCollectionMixin } from '../mixins/InheritanceCollectionMixin';
import { useCallback, useMemo } from 'react';

export type Collection = ReturnType<typeof useCollection>;

export const useCollection = () => {
  const collection = useCollectionV2<InheritanceCollectionMixin>();
  const api = useAPIClient();
  const resource = api?.resource(collection?.name);
  const currentFields = useMemo(() => collection?.fields || [], [collection]);
  const inheritedFields = useMemo(() => collection?.getInheritedFields() || [], [collection]);
  const totalFields = useMemo(() => collection?.getAllFields() || [], [collection]);
  const foreignKeyFields = useMemo(() => collection?.getForeignKeyFields() || [], [collection]);
  const getTreeParentField = useMemo(() => collection?.getAllFields((field) => field.treeParent), [collection]);
  const getField = useCallback(
    (name: SchemaKey) => {
      return collection?.getField(name);
    },
    [collection],
  );
  const getPrimaryKey = useCallback(() => {
    return collection?.getPrimaryKey();
  }, [collection]);
  return {
    ...collection?.getOptions(),
    resource,
    getTreeParentField,
    fields: totalFields,
    getField,
    getPrimaryKey,
    currentFields,
    inheritedFields,
    foreignKeyFields,
  };
};
