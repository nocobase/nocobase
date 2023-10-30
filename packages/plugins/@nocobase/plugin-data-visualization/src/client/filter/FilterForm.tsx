import React, { useContext, useEffect, useMemo } from 'react';
import { createForm, onFieldInit, onFieldMount, onFieldUnmount } from '@formily/core';
import { ChartFilterContext } from './FilterProvider';
import { FormV2, VariablesContext } from '@nocobase/client';
import { transformValue } from './utils';

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
              field.setInitialValue(defaultValue);
            } else {
              field.loading = true;
              const value = await variables.parseVariable(defaultValue);
              field.setInitialValue(transformValue(value, field.componentProps));
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
