import { css } from '@emotion/css';
import { createForm, Field, Form } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import { flatten, unflatten } from '@nocobase/utils/client';
import { Button, Space } from 'antd';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormProvider, SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { Action } from '../action';
import { StablePopover } from '../popover';

export const FilterActionContext = createContext<any>(null);
FilterActionContext.displayName = 'FilterActionContext';

export const FilterAction = observer(
  (props: any) => {
    const { t } = useTranslation();
    const field = useField<Field>();
    const [visible, setVisible] = useState(false);
    const { designable, dn } = useDesignable();
    const fieldSchema = useFieldSchema();
    const form = useMemo<Form>(() => props.form || createForm(), []);
    const { options, onSubmit, onReset, ...others } = useProps(props);
    const onOpenChange = useCallback((visible: boolean): void => {
      setVisible(visible);
    }, []);

    return (
      <FilterActionContext.Provider value={{ field, fieldSchema, designable, dn }}>
        <StablePopover
          destroyTooltipOnHide
          placement={'bottomLeft'}
          open={visible}
          onOpenChange={onOpenChange}
          trigger={'click'}
          content={
            <form>
              <FormProvider form={form}>
                <SchemaComponent
                  schema={{
                    type: 'object',
                    properties: {
                      filter: {
                        type: 'string',
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
                        onReset?.(form.values);
                        field.title = t('Filter');
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
                        onSubmit?.(form.values);
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
          <Action {...others} title={field.title} />
        </StablePopover>
      </FilterActionContext.Provider>
    );
  },
  { displayName: 'FilterAction' },
);

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
        border-color: var(--colorSettings);
        color: var(--colorSettings);
      `}
      onClick={() => {
        const defaultValue = { ...form.values.filter };
        fieldSchema.default = defaultValue;

        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            // undefined 会在转成 JSON 时被删除，这里转成 null 是为了防止被删除
            default: undefinedToNull(defaultValue),
          },
        });
        dn.refresh();
      }}
    >
      {t('Save conditions')}
    </Button>
  );
};

/**
 * 将一个对象中所有值为 undefined 的属性转换为值为 null 的
 * @param value
 * @returns
 */
function undefinedToNull(value) {
  const flat = flatten(value);

  Object.keys(flat).forEach((key) => {
    if (flat[key] === undefined) {
      flat[key] = null;
    }
  });

  return unflatten(flat);
}
