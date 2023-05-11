import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect, useState } from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { InternalPicker } from './InternalPicker';
import { AssociationSelect } from './AssociationSelect';
import { useAssociationCreateActionProps as useCAP } from '../../../block-provider/hooks';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { SchemaComponentOptions } from '../../';
import { InternalSubTable } from './InternalSubTable';
import { InternalFileManager } from './FileManager';

export const Editable = observer((props: any) => {
  useEffect(() => {
    props.mode && setCurrentMode(props.mode);
  }, [props.mode]);
  const { multiple } = props;
  const field: any = useField();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollection } = useCollectionManager();
  const collectionField = getField(field.props.name);
  const isFileCollection = getCollection(collectionField?.target)?.template === 'file';
  const [currentMode, setCurrentMode] = useState(props.mode || (isFileCollection ? 'FileManager' : 'Select'));
  const useCreateActionProps = () => {
    const { onClick } = useCAP();
    const actionField: any = useField();
    return {
      async onClick() {
        await onClick();
        const { data } = actionField.data?.data?.data || {};
        if (['m2m', 'o2m'].includes(collectionField.interface) && multiple !== false) {
          const values = JSON.parse(JSON.stringify(form.values[fieldSchema.name] || []));
          values.push({
            ...data,
          });
          setTimeout(() => {
            form.setValuesIn(field.props.name, values);
          }, 100);
        } else {
          const value = {
            ...data,
          };
          setTimeout(() => {
            form.setValuesIn(field.props.name, value);
          }, 100);
        }
      },
    };
  };
  return (
    <AssociationFieldProvider>
      <SchemaComponentOptions scope={{ useCreateActionProps }}>
        {currentMode === 'Picker' && <InternalPicker {...props} />}
        {currentMode === 'Nester' && <InternalNester {...props} />}
        {currentMode === 'Select' && <AssociationSelect {...props} />}
        {currentMode === 'SubTable' && <InternalSubTable {...props} />}
        {currentMode === 'FileManager' && <InternalFileManager {...props} />}
      </SchemaComponentOptions>
    </AssociationFieldProvider>
  );
});
