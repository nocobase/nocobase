import React, { useContext } from 'react';
import { observer, RecursionField, Schema } from '@formily/react';
import { cloneDeepWith, set } from 'lodash';
import { uid, merge } from '@formily/shared';
import { CollectionFieldContext,TableRowContext } from './context';
import { Table } from './Table';

export const TableCell = observer((props: any) => {
  const ctx = useContext(TableRowContext);
  const schema = props.schema;
  const collectionField = useContext(CollectionFieldContext);
  if (schema['x-component'] === 'Table.Operation') {
    return <Table.Operation.Cell {...props} />;
  }
  let uiSchema = collectionField?.uiSchema as Schema;
  if (uiSchema?.['x-component'] === 'Upload.Attachment') {
    uiSchema = cloneDeepWith(uiSchema);
    set(uiSchema, 'x-component-props.size', 'small');
  }
  const componentProps = merge(uiSchema?.['x-component-props'] || {}, schema?.['x-component-props'] || {}, {
    arrayMerge: (t, s) => s,
  });
  console.log('Table.Cell', collectionField?.interface, componentProps);
  return (
    <div className={`field-interface-${collectionField?.interface}`}>
      <RecursionField
        schema={
          !collectionField
            ? schema
            : new Schema({
                type: 'void',
                properties: {
                  [collectionField.name]: {
                    ...uiSchema,
                    title: undefined,
                    'x-read-pretty': true,
                    'x-decorator-props': {
                      feedbackLayout: 'popover',
                    },
                    'x-decorator': 'FormilyFormItem',
                    'x-component-props': componentProps,
                    properties: {
                      ...schema?.properties,
                    },
                  },
                },
              })
        }
        name={ctx.index}
        onlyRenderProperties
      />
    </div>
  );
});
