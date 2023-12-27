import set from 'lodash/set';
import { useMemo } from 'react';
import { useCollectionManagerV2 } from '../../application';

export const useOptions = () => {
  const collectionManager = useCollectionManagerV2();

  return useMemo(() => {
    const fields = {};
    const fieldInterfaces = collectionManager.getCollectionFieldInterfaces();
    fieldInterfaces.forEach((fieldInterface) => {
      const options = fieldInterface.getOptions();
      registerField(options.group || 'others', options.type, { order: 0, ...options });
    });

    function registerField(group: string, type: string, schema) {
      fields[group] = fields[group] || {};
      set(fields, [group, type], schema);
    }

    const groupLabels = {
      basic: '{{t("Basic")}}',
      choices: '{{t("Choices")}}',
      media: '{{t("Media")}}',
      datetime: '{{t("Date & Time")}}',
      relation: '{{t("Relation")}}',
      advanced: '{{t("Advanced type")}}',
      systemInfo: '{{t("System info")}}',
      others: '{{t("Others")}}',
    };

    return Object.keys(groupLabels).map((groupName) => ({
      label: groupLabels[groupName],
      key: groupName,
      children: Object.keys(fields[groupName] || {})
        .map((type) => {
          const field = fields[groupName][type];
          return {
            value: type,
            label: field.title,
            name: type,
            ...fields[groupName][type],
          };
        })
        .sort((a, b) => a.order - b.order),
    }));
  }, [collectionManager]);
};
