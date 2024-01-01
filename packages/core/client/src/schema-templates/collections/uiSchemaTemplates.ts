import { CollectionOptionsV2 } from '../../application';

export const uiSchemaTemplatesCollection: CollectionOptionsV2 = {
  name: 'uiSchemaTemplates',
  filterTargetKey: 'key',
  targetKey: 'key',
  fields: [
    {
      type: 'integer',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Template name") }}',
        type: 'number',
        'x-component': 'Input',
        required: true,
      },
    },
  ],
};
