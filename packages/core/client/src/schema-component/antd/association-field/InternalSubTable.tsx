import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, RecursionField } from '@formily/react';
import React, { useEffect, useContext } from 'react';
import { unionBy } from 'lodash';
import { useInsertSchema } from './hooks';
import { useCollection } from '../../../collection-manager';
import schema from './schema';
import { SchemaComponentOptions, useActionContext, RecordPickerContext } from '../../';

export const InternalSubTable: any = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field: any = useField<Field>();
  const insertSubTable = useInsertSchema('SubTable');
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  useEffect(() => {
    const association = `${collectionField.collectionName}.${collectionField.name}`;
    (schema.SubTable['x-acl-action'] = `${collectionField.target}:list`),
      (schema.SubTable['x-decorator-props'] = {
        collection: collectionField.target,
        association: association,
        resource: association,
        action: 'list',
        params: {
          paginate: false,
        },
        showIndex: true,
        dragSort: false,
      }),
      insertSubTable(schema.SubTable);
  }, []);

  const usePickActionProps = () => {
    const { setVisible } = useActionContext();
    const { multiple, selectedRows, onChange, options, collectionField } = useContext(RecordPickerContext);
    return {
      onClick() {
        if (multiple) {
          onChange(unionBy(selectedRows, options, collectionField?.targetKey || 'id'));
        } else {
          onChange(selectedRows?.[0] || null);
        }
        setVisible(false);
      },
    };
  };
  return (
    <div>
      <SchemaComponentOptions scope={{ usePickActionProps }}>
        <RecursionField
          onlyRenderProperties
          basePath={field.address}
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'AssociationField.SubTable';
          }}
        />
      </SchemaComponentOptions>
    </div>
  );
});
