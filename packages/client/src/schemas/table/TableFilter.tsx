import React, { useMemo, useState } from 'react';
import {  Popover, Button,  } from 'antd';
import { useTranslation } from 'react-i18next';
import flatten from 'flat';
import { createForm } from '@formily/core';
import { FormProvider, observer } from '@formily/react';
import { FormButtonGroup,  Submit } from '@formily/antd';
import { interfaces } from '../database-field/interfaces';
import { useDesignable } from '..';
import { useCollectionContext,  } from '../../constate';
import { SchemaField } from '../../components/schema-renderer';
import { useTable } from './hooks/useTable';
import { useCompile } from '../../hooks/useCompile';
import IconPicker from '../../components/icon-picker';

export const TableFilter = observer((props: any) => {
  const { service } = useTable();
  const { fieldNames = [] } = props;
  const compile = useCompile();
  const { t } = useTranslation();
  const { schema, DesignableBar } = useDesignable();
  const form = useMemo(() => createForm(), []);
  const { fields = [] } = useCollectionContext();
  const [visible, setVisible] = useState(false);
  const obj = flatten(form.values.filter || {});
  console.log('flatten', obj, Object.values(obj));
  const count = Object.values(obj).filter((i) => (Array.isArray(i) ? i.length : i)).length;
  const icon = props.icon || 'FilterOutlined';
  const properties = fieldsToFilterColumns(fields, { fieldNames });
  schema.mapProperties((p) => {
    properties[p.name] = p;
  });
  return (
    <Popover
      trigger={['click']}
      placement={'bottomLeft'}
      visible={visible}
      onVisibleChange={setVisible}
      content={
        <div>
          <FormProvider form={form}>
            <SchemaField
              schema={{
                type: 'object',
                properties: {
                  filter: {
                    type: 'object',
                    'x-component': 'Filter',
                    properties,
                  },
                },
              }}
            />
            <FormButtonGroup align={'right'}>
              <Button
                onClick={() => {
                  setVisible(false);
                  form.reset();
                  const { filter } = form.values;
                  return service.run({
                    ...service.params[0],
                    filter,
                  });
                }}
              >
                {t('Reset')}
              </Button>
              <Submit
                onSubmit={() => {
                  const { filter } = form.values;
                  console.log('Table.Filter', form.values);
                  setVisible(false);
                  return service.run({
                    ...service.params[0],
                    filter,
                  });
                }}
              >
                {t('Submit')}
              </Submit>
            </FormButtonGroup>
          </FormProvider>
        </div>
      }
    >
      <Button icon={<IconPicker type={icon} />}>
        {count > 0 ? t('{{count}} filter items', { count }) : compile(schema.title)}
        <DesignableBar />
      </Button>
    </Popover>
  );
});
