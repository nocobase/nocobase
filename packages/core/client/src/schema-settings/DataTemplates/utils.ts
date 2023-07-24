import { ArrayBase } from '@formily/antd-v5';
import { getAssociationPath } from '../../block-provider/hooks';
import { useCollectionManager } from '../../collection-manager';

export const useSyncFromForm = (fieldSchema) => {
  const { getCollectionJoinField } = useCollectionManager();
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex();
  return {
    async run() {
      const formData = new Set([]);
      const selectFields = new Set([]);
      const getAssociationAppends = (schema, str) => {
        schema.reduceProperties((pre, s) => {
          const prefix = pre || str;
          const collectionfield = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field']);
          const isAssociationSubfield = s.name.includes('.');
          const isAssociationField =
            collectionfield && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(collectionfield.type);
          const fieldPath = !isAssociationField && isAssociationSubfield ? getAssociationPath(s.name) : s.name;
          const path = prefix === '' || !prefix ? fieldPath : prefix + '.' + fieldPath;
          if (collectionfield) {
            selectFields.add(path);
          }
          if (collectionfield && (isAssociationField || isAssociationSubfield) && s['x-component'] !== 'TableField') {
            formData.add({ name: path, fieldMode: s['x-component-props']['mode'] || 'Select' });
            if (['Nester', 'SubTable'].includes(s['x-component-props']?.mode)) {
              const bufPrefix = prefix && prefix !== '' ? prefix + '.' + s.name : s.name;
              getAssociationAppends(s, bufPrefix);
            }
          } else if (
            ![
              'ActionBar',
              'Action',
              'Action.Link',
              'Action.Modal',
              'Selector',
              'Viewer',
              'AddNewer',
              'AssociationField.Selector',
              'AssociationField.AddNewer',
              'TableField',
            ].includes(s['x-component'])
          ) {
            getAssociationAppends(s, str);
          }
        }, str);
      };
      getAssociationAppends(fieldSchema, '');
      array.field.value.splice(index, 1, { ...array?.field?.value[index], fields: [...selectFields] });
    },
  };
};
