import { createForm, Field, onFormSubmit } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { FormProvider } from '../../core';
import { ActionContext } from '../action';
import { useFieldNames } from './useFieldNames';

export const InputRecordPicker: React.FC<any> = (props) => {
  const { multiple, onChange } = props;
  const fieldNames = useFieldNames(props);
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const [value, setValue] = useState(field.value);
  useEffect(() => {
    setValue(field.value);
  }, [JSON.stringify(field.value)]);
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          value: field.value,
        },
        effects() {
          onFormSubmit((form) => {
            setValue(form.values.value);
            onChange?.(form.values.value);
          });
        },
      }),
    [JSON.stringify(field.value)],
  );
  const toValue = (value) => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        return {
          label: item[fieldNames.label] || item[fieldNames.value],
          value: item[fieldNames.value],
        };
      });
    }
    return {
      label: value[fieldNames.label] || value[fieldNames.value],
      value: value[fieldNames.value],
    };
  };
  return (
    <div>
      <Select
        size={props.size}
        mode={multiple ? 'multiple' : props.mode}
        // fieldNames={fieldNames}
        onClick={() => {
          setVisible(true);
        }}
        labelInValue={true}
        value={toValue(value)}
        open={false}
      />
      <ActionContext.Provider value={{ visible, setVisible }}>
        <FormProvider form={form}>
          <RecursionField schema={fieldSchema} onlyRenderProperties />
        </FormProvider>
      </ActionContext.Provider>
    </div>
  );
};
