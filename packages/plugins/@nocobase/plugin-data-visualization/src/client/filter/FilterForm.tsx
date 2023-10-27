import React, { useContext, useEffect, useMemo } from 'react';
import { createForm, onFieldChange, onFieldInit, onFieldMount, onFieldUnmount } from '@formily/core';
import { ChartFilterContext } from './FilterProvider';
import { FormV2, VariablesContext } from '@nocobase/client';

export const ChartFilterForm: React.FC = (props) => {
  const { addField, removeField, setForm } = useContext(ChartFilterContext);
  const variables = useContext(VariablesContext);
  const form = useMemo(
    () =>
      createForm({
        effects() {
          const getField = (field: any) => {
            if (field.displayName !== 'Field') {
              return null;
            }
            const { name } = field.props || {};
            return name;
          };
          onFieldInit('*', (field: any) => {
            const name = getField(field);
            if (!name) {
              return;
            }
            field.setValue(null);
          });
          onFieldMount('*', async (field: any) => {
            const name = getField(field);
            if (!name) {
              return;
            }
            addField(name, { title: field.title, operator: field.componentProps['filter-operator'] });

            // parse default value
            const defaultValue = field.componentProps.defaultValue;
            const isVariable =
              typeof defaultValue === 'string' && defaultValue?.startsWith('{{$') && defaultValue?.endsWith('}}');
            if (!isVariable) {
              field.setValue(defaultValue);
            } else {
              field.loading = true;
              const value = await variables.parseVariable(defaultValue);
              field.setValue(value);
              field.loading = false;
            }
          });
          onFieldUnmount('*', (field: any) => {
            const name = getField(field);
            if (!name) {
              return;
            }
            removeField(name);
          });
        },
      }),
    [addField, removeField, variables],
  );

  useEffect(() => setForm(form), [form, setForm]);
  return <FormV2 {...props} form={form} />;
};
