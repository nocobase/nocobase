import { FilterOutlined } from '@ant-design/icons';
import { FormButtonGroup, Submit } from '@formily/antd';
import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Popover } from 'antd';
import flatten from 'flat';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { useCompile } from '../../hooks/useCompile';
import { useFilterContext } from './hooks';

export const FilterAction = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { DesignableBar } = useDesignable();
  const filedSchema = useFieldSchema();
  const form = useMemo(() => createForm(), []);
  const { visible, setVisible } = useFilterContext();
  const obj = flatten(form.values.filter || {});
  const count = Object.values(obj).filter((i) => (Array.isArray(i) ? i.length : i)).length;
  const { fields } = useCollection();
  const { getInterface } = useCollectionManager();
  const properties = {};
  fields?.forEach((field) => {
    const { operators } = getInterface(field.interface);
    properties[uid()] = {
      type: 'void',
      title: field?.uiSchema?.title ?? field.title,
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: [...operators],
      },
      properties: {
        [field.name ?? uid()]: { ...field?.uiSchema },
      },
    };
  });
  const schema = {
    type: 'void',
    properties: {
      filter: {
        type: 'array',
        'x-component': 'Filter',
        properties,
      },
    },
  };
  return (
    <Popover
      trigger={['click']}
      placement={'bottomLeft'}
      visible={visible}
      onVisibleChange={setVisible}
      content={
        <div>
          <FieldContext.Provider value={null}>
            <FormContext.Provider value={form}>
              <SchemaComponent schema={schema} name="filter" />
              <FormButtonGroup align={'right'}>
                <Submit
                  onSubmit={() => {
                    const { filter } = form.values;
                    console.log('Table.Filter====', form.values);
                    debugger;
                    setVisible(false);
                  }}
                >
                  {t('Submit')}
                </Submit>
              </FormButtonGroup>
            </FormContext.Provider>
          </FieldContext.Provider>
        </div>
      }
    >
      <Button icon={<FilterOutlined />}>
        {count > 0 ? t('{{count}} filter items', { count }) : compile(filedSchema.title)}
        <DesignableBar />
      </Button>
    </Popover>
  );
});
