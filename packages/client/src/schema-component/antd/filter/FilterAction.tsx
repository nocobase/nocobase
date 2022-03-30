import { css } from '@emotion/css';
import { createForm, Field, Form } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import { merge } from '@formily/shared';
import { Button, Popover, Space } from 'antd';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormProvider, SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';

export const FilterActionContext = createContext<any>(null);

export const FilterAction = observer((props: any) => {
  const { useProps, ...rest1 } = props;
  const rest2 = useProps?.();
  const { t } = useTranslation();
  const field = useField<Field>();
  const [visible, setVisible] = useState(false);
  const { designable, dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const form = useMemo<Form>(() => props.form || createForm(), [visible]);
  const { options, onSubmit, onReset } = merge(rest1 || {}, rest2);
  return (
    <FilterActionContext.Provider value={{ field, fieldSchema, designable, dn }}>
      <Popover
        placement={'bottomLeft'}
        visible={visible}
        onVisibleChange={(visible) => {
          setVisible(visible);
        }}
        trigger={'click'}
        content={
          <form>
            <FormProvider form={form}>
              <SchemaComponent
                schema={{
                  type: 'object',
                  properties: {
                    filter: {
                      type: 'object',
                      enum: options || field.dataSource,
                      default: fieldSchema.default,
                      'x-component': 'Filter',
                      'x-component-props': {},
                    },
                  },
                }}
              />
              <div
                className={css`
                  display: flex;
                  justify-content: flex-end;
                  width: 100%;
                `}
              >
                <Space>
                  <SaveConditions />
                  <Button
                    onClick={async () => {
                      await form.reset();
                      onReset?.();
                      setVisible(false);
                    }}
                  >
                    {t('Reset')}
                  </Button>
                  <Button
                    type={'primary'}
                    htmlType={'submit'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSubmit?.();
                      setVisible(false);
                    }}
                  >
                    {t('Submit')}
                  </Button>
                </Space>
              </div>
            </FormProvider>
          </form>
        }
      >
        <Button>{field.title || t('Filter')}</Button>
      </Popover>
    </FilterActionContext.Provider>
  );
});

const SaveConditions = () => {
  const { fieldSchema, field, designable, dn } = useContext(FilterActionContext);
  const form = useForm();
  const { t } = useTranslation();
  if (!designable) {
    return null;
  }
  return (
    <Button
      type={'dashed'}
      className={css`
        border-color: rgb(241, 139, 98);
        color: rgb(241, 139, 98);
      `}
      onClick={() => {
        const defaultValue = { ...form.values.filter };
        fieldSchema.default = defaultValue;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            default: defaultValue,
          },
        });
        dn.refresh();
      }}
    >
      {t('Save conditions')}
    </Button>
  );
};
