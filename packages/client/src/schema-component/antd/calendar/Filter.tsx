import { FormButtonGroup, Submit } from '@formily/antd';
import { createForm } from '@formily/core';
import { FormProvider, observer, useFieldSchema } from '@formily/react';
import { Button, Popover } from 'antd';
import flatten from 'flat';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { useCompile } from '../../hooks/useCompile';
import { IconPicker } from '../icon-picker';

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
    <Popover
      trigger={['click']}
      placement={'bottomLeft'}
      visible={visible}
      onVisibleChange={setVisible}
      content={
        <div>
          <FormProvider form={form}>
            <SchemaComponent
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
              <Submit
                onSubmit={() => {
                  const { filter } = form.values;
                  console.log('Table.Filter', form.values);
                  setVisible(false);
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
        {count > 0 ? t('{{count}} filter items', { count }) : compile(filedSchema.title)}
        <DesignableBar />
      </Button>
    </Popover>
  );
});
