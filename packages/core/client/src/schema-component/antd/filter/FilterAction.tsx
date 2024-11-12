/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { createForm, Field, Form } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import { flatten, unflatten } from '@nocobase/utils/client';
import { Button, Space } from 'antd';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { FormProvider, SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { Action, ActionProps } from '../action';
import { DatePickerProvider } from '../date-picker/DatePicker';
import { StablePopover } from '../popover';
import { useCompile } from '../../';

export const FilterActionContext = createContext<any>(null);
FilterActionContext.displayName = 'FilterActionContext';

export type FilterActionProps<T = {}> = ActionProps & {
  options?: any[];
  form?: Form;
  onSubmit?: (values: T) => void;
  onReset?: (values: T) => void;
  /**
   * @default Popover
   * 在移动端中，会使用移动端的 Popup 组件
   */
  Container?: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: 'click' | 'hover';
    content: React.ReactElement;
    children: React.ReactElement;
  }) => React.ReactElement;
};

export const FilterAction = withDynamicSchemaProps(
  observer((props: FilterActionProps) => {
    const { t } = useTranslation();
    const field = useField<Field>();
    const [visible, setVisible] = useState(false);
    const { designable, dn } = useDesignable();
    const fieldSchema = useFieldSchema();
    const compile = useCompile();

    const form = useMemo<Form>(() => props.form || createForm(), []);

    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { options, onSubmit, onReset, Container = StablePopover, ...others } = useProps(props);

    const onOpenChange = useCallback((visible: boolean): void => {
      setVisible(visible);
    }, []);
    return (
      <FilterActionContext.Provider value={{ field, fieldSchema, designable, dn }}>
        <Container
          destroyTooltipOnHide
          placement={'bottomLeft'}
          open={visible}
          onOpenChange={onOpenChange}
          trigger={'click'}
          content={
            <form>
              <FormProvider form={form}>
                <DatePickerProvider value={{ utc: false }}>
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
                </DatePickerProvider>
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
                        field.title = compile(fieldSchema.title) || t('Filter');
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
          <Action onClick={() => setVisible(!visible)} {...others} title={field.title} />
        </Container>
      </FilterActionContext.Provider>
    );
  }),
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
