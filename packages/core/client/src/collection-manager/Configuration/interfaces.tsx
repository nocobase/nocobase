import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { useMemo } from 'react';
import { useDataSourceManager } from '../../data-source/data-source/DataSourceManagerProvider';

export const getOptions = (
  fieldInterfaces: Record<string, CollectionFieldInterface[]>,
  fieldGroups: Record<string, { label: string; order?: number }>,
) => {
  return Object.keys(fieldGroups)
    .map((groupName) => {
      const group = fieldGroups[groupName];
      return {
        ...group,
        key: groupName,
        children: Object.keys(fieldInterfaces[groupName] || {})
          .map((type) => {
            const field = fieldInterfaces[groupName][type];
            return {
              value: type,
              label: field.title,
              name: type,
              ...fieldInterfaces[groupName][type],
            };
          })
          .sort((a, b) => a.order - b.order),
      };
    })
    .sort((a, b) => a.order - b.order);
};

export const useFieldInterfaceOptions = () => {
  const dm = useDataSourceManager();

  return useMemo(() => {
    const fieldInterfaceInstances = dm.collectionFieldInterfaceManager.getFieldInterfaces();
    const fieldGroups = dm.collectionFieldInterfaceManager.getFieldInterfaceGroups();
    const fieldInterfaceInstancesByGroups = fieldInterfaceInstances.reduce<Record<string, CollectionFieldInterface[]>>(
      (memo, fieldInterface) => {
        const group = fieldInterface.group || 'basic';
        if (!memo[group]) {
          memo[group] = [];
        }
        memo[group].push(fieldInterface);
        return memo;
      },
      {},
    );
    return getOptions(fieldInterfaceInstancesByGroups, fieldGroups);
  }, [dm]);
};
