import { useCompile } from '../../schema-component';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../collection-manager';

const supportsType = [
  'id',
  'checkbox',
  'number',
  'percent',
  'integer',
  'input',
  'textarea',
  'email',
  'phone',
  'datetime',
  'createdAt',
  'updatedAt',
  'radioGroup',
  'checkboxGroup',
  'select',
  'multipleSelect',
  'formula',
  'oho',
  'obo',
  'm2o',
  'o2m',
  'm2m',
];
const useVariableTypes = (currentCollection, excludes = []) => {
  const { getCollectionFields, getInterface, getCollection } = useCollectionManager_deprecated();
  const collection = getCollection(currentCollection);
  const fields = getCollectionFields(currentCollection);
  return [
    {
      title: collection.title,
      value: currentCollection,
      options() {
        const field2option = (field, depth) => {
          if (!field.interface || !supportsType.filter((v) => !excludes.includes(v)).includes(field.interface)) {
            return;
          }
          const fieldInterface = getInterface(field.interface);
          if (!fieldInterface?.filterable) {
            return;
          }
          const { nested, children } = fieldInterface.filterable;
          const option = {
            key: field.name,
            label: field?.title || field.uiSchema?.title,
            schema: field?.uiSchema,
            value: field.name,
          };
          if (field.target && depth > 1) {
            return;
          }
          if (depth > 1) {
            return option;
          }
          if (children?.length) {
            option['children'] = children;
          }
          if (nested) {
            const targetFields = getCollectionFields(field.target);
            const options = getOptions(targetFields, depth + 1).filter(Boolean);
            option['children'] = option['children'] || [];
            option['children'].push(...options);
          }
          return option;
        };
        const getOptions = (fields, depth) => {
          const options = [];
          fields.forEach((field) => {
            const option = field2option(field, depth);
            if (option) {
              options.push(option);
            }
          });
          return options;
        };
        return getOptions(fields, 1);
      },
    },
    {
      title: `{{t("System variables")}}`,
      value: '$system',
      options: [
        {
          key: 'now',
          value: 'now',
          label: `{{t("Current time")}}`,
        },
      ],
    },
  ];
};

export function useVariableOptions(collectionName, excludes?) {
  const compile = useCompile();
  const options = useVariableTypes(collectionName, excludes).map((item) => {
    const options = typeof item.options === 'function' ? item.options() : item.options;
    return {
      label: compile(item.title),
      value: item.value,
      key: item.value,
      children: compile(options),
      disabled: options && !options.length,
    };
  });
  return options;
}
