import React, { memo, useContext, useEffect, useMemo, useRef } from 'react';
import { createForm, onFieldInit, onFieldMount, onFieldUnmount } from '@formily/core';
import { ChartFilterContext } from './FilterProvider';
import { DEFAULT_DATA_SOURCE_KEY, FormV2, VariablesContext } from '@nocobase/client';
import { setDefaultValue } from './utils';
import { useChartFilter } from '../hooks';

export const ChartFilterForm: React.FC = memo((props) => {
  const { setField, removeField, setForm } = useContext(ChartFilterContext);
  const { getTranslatedTitle } = useChartFilter();
  const variables = useRef<any>(null);
  variables.current = useContext(VariablesContext);
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
            setField(name, {
              title: field.title,
              operator: field.componentProps['filter-operator'],
            });

            // parse field title
            if (field.title.includes('/')) {
              field.title = getTranslatedTitle(field.title);
            }

            // parse default value
            setDefaultValue(field, variables.current);
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
    [setField, getTranslatedTitle, removeField, variables],
  );

  useEffect(() => setForm(form), [form, setForm]);
  return <FormV2 {...props} form={form} />;
});
ChartFilterForm.displayName = 'ChartFilterForm';
