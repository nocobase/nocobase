import { CollectionFieldInterfaceV2, useCollectionManagerV2 } from '../../application';
import { useMemo } from 'react';

export const getOptions = (
  fieldInterfaces: Record<string, CollectionFieldInterfaceV2[]>,
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
  const cm = useCollectionManagerV2();

  return useMemo(() => {
    const fieldInterfaceInstances = cm.getFieldInterfaces();
    const fieldGroups = cm.getFieldGroups();
    const fieldInterfaceInstancesByGroups = Object.values(fieldInterfaceInstances).reduce<
      Record<string, CollectionFieldInterfaceV2[]>
    >((memo, fieldInterface) => {
      const group = fieldInterface.group || 'basic';
      if (!memo[group]) {
        memo[group] = [];
      }
      memo[group].push(fieldInterface);
      return memo;
    }, {});
    return getOptions(fieldInterfaceInstancesByGroups, fieldGroups);
  }, [cm]);
};
