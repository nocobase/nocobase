import { useField } from '@formily/react';
import { useCollectionManager } from '../../collection-manager';

export const useSyncFromForm = (fieldSchema) => {
  const { refreshCM, getCollectionJoinField } = useCollectionManager();

  const field = useField();
  return {
    async run() {
      const formData = new Set([]);
      const getAssociationAppends = (schema) => {
        schema.reduceProperties((_, s) => {
          const collectionfield = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field']);
          const isAssociationSubfield = s.name.includes('.');
          const isAssociationField =
            collectionfield && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(collectionfield.type);
          if (collectionfield && (isAssociationField || isAssociationSubfield) && s['x-component'] !== 'TableField') {
            formData.add(s.name);
            if (['Nester', 'SubTable'].includes(s['x-component-props']?.mode)) {
              getAssociationAppends(s);
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
            getAssociationAppends(s);
          }
        }, null);
      };
      getAssociationAppends(fieldSchema);

      console.log(formData, fieldSchema);
    },
  };
};
