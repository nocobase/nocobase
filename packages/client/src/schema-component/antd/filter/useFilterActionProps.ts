import { useBlockRequestContext } from '../../../block-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';

export const useFilterOptions = (collectionName: string) => {
  const { getCollectionFields, getInterface } = useCollectionManager();
  const fields = getCollectionFields(collectionName);
  const field2option = (field, nochildren) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = getInterface(field.interface);
    if (!fieldInterface.filterable) {
      return;
    }
    const { nested, children, operators } = fieldInterface.filterable;
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
      operators: operators || [],
    };
    if (nochildren) {
      return option;
    }
    if (children?.length) {
      option['children'] = children;
    }
    if (nested) {
      const targetFields = getCollectionFields(field.target);
      const options = getOptions(targetFields, true);
      option['children'] = option['children'] || [];
      option['children'].push(...options);
    }
    return option;
  };
  const getOptions = (fields, nochildren = false) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, nochildren);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  return getOptions(fields);
};

export const useFilterActionProps = () => {
  const { name } = useCollection();
  const options = useFilterOptions(name);
  const { service } = useBlockRequestContext();
  return {
    options,
    onSubmit({ filter }) {
      console.log('filter', filter)
      service.run({ ...service.params?.[0], filter });
    },
  };
};
