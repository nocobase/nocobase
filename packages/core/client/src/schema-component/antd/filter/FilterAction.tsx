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
import { useCompile, useDesignable } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { Action, ActionProps } from '../action';
import { DatePickerProvider } from '../date-picker/DatePicker';
import { StablePopover } from '../popover';

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

const InternalFilterAction = React.memo((props: FilterActionProps) => {
  const field = useField<Field>();
  const [visible, setVisible] = useState(false);
  const { designable, dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const form = useMemo<Form>(() => props.form || createForm(), []);

  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { options, onSubmit, onReset, Container = StablePopover, icon, onlyIcon } = useProps(props);

  const onOpenChange = useCallback((visible: boolean): void => {
    setVisible(visible);
  }, []);

  const filterActionContextValue = useMemo(
    () => ({ field, fieldSchema, designable, dn }),
    [designable, dn, field, fieldSchema],
  );

  const handleClick = useCallback(() => setVisible((visible) => !visible), []);

  const content = useMemo(() => {
    return (
      <FilterActionContent
        form={form}
        options={options}
        field={field}
        fieldSchema={fieldSchema}
        onReset={onReset}
        setVisible={setVisible}
        onSubmit={onSubmit}
      />
    );
  }, [field, fieldSchema, form, onReset, onSubmit, options]);
  return (
    <FilterActionContext.Provider value={filterActionContextValue}>
      <Container
        destroyTooltipOnHide
        placement={'bottomLeft'}
        open={visible}
        onOpenChange={onOpenChange}
        trigger={'click'}
        content={content}
      >
        {/* Adding a div here can prevent unnecessary re-rendering of Action */}
        <div>
          <Action onClick={handleClick} icon={icon} onlyIcon={onlyIcon} />
        </div>
      </Container>
    </FilterActionContext.Provider>
  );
});

InternalFilterAction.displayName = 'InternalFilterAction';

export const FilterAction = withDynamicSchemaProps((props: FilterActionProps) => {
  // When clicking submit, "disabled" will change from undefined to false, which triggers a re-render.
  // Here we convert the default undefined to false to avoid unnecessary re-rendering.
  return <InternalFilterAction {...props} disabled={!!props.disabled} />;
});

FilterAction.displayName = 'FilterAction';

const SaveConditions = () => {
  const { fieldSchema, designable, dn } = useContext(FilterActionContext);
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

const utcValue = { utc: false };

const className1 = css`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const FilterActionContent = observer(
  ({
    form,
    options,
    field,
    fieldSchema,
    onReset,
    setVisible,
    onSubmit,
  }: {
    form: Form<any>;
    options: any;
    field: Field<any, any, any, any>;
    fieldSchema;
    onReset: any;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onSubmit: any;
  }) => {
    const compile = useCompile();
    const { t } = useTranslation();
    const schema = useMemo(() => {
      return {
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
      };
    }, [field?.dataSource, fieldSchema?.default, options]);

    return (
      <form>
        <FormProvider form={form}>
          <DatePickerProvider value={utcValue}>
            <SchemaComponent schema={schema} />
          </DatePickerProvider>
          <div className={className1}>
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
    );
  },
);

FilterActionContent.displayName = 'FilterActionContent';

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
