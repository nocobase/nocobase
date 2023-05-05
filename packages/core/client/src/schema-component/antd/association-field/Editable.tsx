import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect, useState } from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { InternalSelect } from './InternalSelect';
import { AssociationSelect } from './AssociationSelect';
import { useCreateActionProps as useCAP } from '../../../block-provider/hooks';
import { useCollection } from '../../../collection-manager';
import { SchemaComponentOptions } from '../../';
import { InternalSubTable } from './InternalSubTable';

export const Editable = observer((props: any) => {
  const { fieldNames } = props;
  const [currentMode, setCurrentMode] = useState(props.mode || 'Select');
  useEffect(() => {
    props.mode && setCurrentMode(props.mode);
  }, [props.mode]);
  const field: any = useField();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  const useCreateActionProps = () => {
    const { onClick } = useCAP();
    const actionField = useField();
    return {
      async onClick() {
        await onClick();
        const { data } = actionField.data?.data?.data || {};
        if (['oho', 'obo', 'm2o'].includes(collectionField.interface)) {
          form.setValuesIn(field.props.name, {
            [fieldNames.label]: data[fieldNames.label],
            id: data.id,
            value: data.id,
          });
        } else {
          const values = JSON.parse(JSON.stringify(form.values[fieldSchema.name]));
          values.push({
            [fieldNames?.label]: data?.[fieldNames?.label],
            id: data?.id,
            value: data?.id,
          });
          form.setValuesIn(field.props.name, values);
        }
      },
    };
  };

  return (
    <AssociationFieldProvider>
      <SchemaComponentOptions scope={{ useCreateActionProps }}>
        {currentMode === 'Picker' && <InternalSelect {...props} />}
        {currentMode === 'Nester' && <InternalNester {...props} />}
        {currentMode === 'Select' && <AssociationSelect {...props} />}
        {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      </SchemaComponentOptions>
    </AssociationFieldProvider>
  );
});
