import { createForm } from '@formily/core';
import { observer, useFieldSchema } from '@formily/react';
import flatten from 'flat';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { useCompile } from '../../hooks/useCompile';
import { FilterContext } from '../filter/context';

export const Filter = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { properties } = props;
  const { DesignableBar } = useDesignable();
  const filedSchema = useFieldSchema();
  const form = useMemo(() => createForm(), []);
  const [visible, setVisible] = useState(false);
  const obj = flatten(form.values.filter || {});
  const count = Object.values(obj).filter((i) => (Array.isArray(i) ? i.length : i)).length;
  const icon = props.icon || 'FilterOutlined';
  filedSchema.mapProperties((p) => {
    properties[p.name] = p;
  });
  return (
    <FilterContext.Provider value={{ visible, setVisible }}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            filter: {
              type: 'object',
              title: t('Filter'),
              'x-component': 'Filter.Action',
            },
          },
        }}
      />
    </FilterContext.Provider>
  );
});
