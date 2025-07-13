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
import { Button, Space } from 'antd';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { FormProvider, SchemaComponent } from '../../core';
import { useCompile, useDesignable } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { Action, ActionProps } from '../action';
import { StablePopover } from '../popover';

export const EditTableActionContext = createContext<any>(null);
EditTableActionContext.displayName = 'EditTableActionContext';

export type EditTableActionProps<T = {}> = ActionProps & {
  columns?: any[];
  form?: Form;
  onSubmit?: (values: T) => void;
  onReset?: (values: T) => void;
  /**
   * @default Popover
   * For mobile, will use mobile Popup component
   */
  Container?: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: 'click' | 'hover';
    content: React.ReactElement;
    children: React.ReactElement;
  }) => React.ReactElement;
};

const InternalEditTableAction = React.memo((props: EditTableActionProps) => {
  const field = useField<Field>();
  const [visible, setVisible] = useState(false);
  const { designable, dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const form = useMemo<Form>(() => props.form || createForm(), [props.form]);

  // Compatible with old UISchema (before 1.0), keeping useProps for compatibility
  const { columns, onSubmit, onReset, Container = StablePopover, icon, onlyIcon } = useProps(props);

  const onOpenChange = useCallback((visible: boolean): void => {
    setVisible(visible);
  }, []);

  const editTableActionContextValue = useMemo(
    () => ({ field, fieldSchema, designable, dn }),
    [designable, dn, field, fieldSchema],
  );

  const handleClick = useCallback(() => setVisible((visible) => !visible), []);

  const content = useMemo(() => {
    return (
      <EditTableActionContent
        form={form}
        columns={columns}
        field={field}
        fieldSchema={fieldSchema}
        onReset={onReset}
        setVisible={setVisible}
        onSubmit={onSubmit}
      />
    );
  }, [field, fieldSchema, form, onReset, onSubmit, columns]);

  return (
    <EditTableActionContext.Provider value={editTableActionContextValue}>
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
    </EditTableActionContext.Provider>
  );
});

InternalEditTableAction.displayName = 'InternalEditTableAction';

export const EditTableAction = withDynamicSchemaProps((props: EditTableActionProps) => {
  // When clicking submit, "disabled" will change from undefined to false, which triggers a re-render.
  // Here we convert the default undefined to false to avoid unnecessary re-rendering.
  return <InternalEditTableAction {...props} disabled={!!props.disabled} />;
});

EditTableAction.displayName = 'EditTableAction';

// Removed SaveColumnSettings component as per user request

const className1 = css`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const EditTableActionContent = observer(
  ({
    form,
    columns,
    field,
    fieldSchema,
    onReset,
    setVisible,
    onSubmit,
  }: {
    form: Form<any>;
    columns: any;
    field: Field<any, any, any, any>;
    fieldSchema;
    onReset: any;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onSubmit: any;
  }) => {
    const compile = useCompile();
    const { t } = useTranslation();

    const schema = useMemo(() => {
      const finalColumns = columns || field.dataSource || [];

      return {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            default: fieldSchema.default || finalColumns,
            'x-component': 'EditTable',
            'x-component-props': {
              columns: finalColumns,
            },
          },
        },
      };
    }, [field?.dataSource, fieldSchema?.default, columns]);

    return (
      <form>
        <FormProvider form={form}>
          <SchemaComponent schema={schema} />
          <div className={className1}>
            <Space>
              <Button
                onClick={async () => {
                  await form.reset();
                  onReset?.(form.values);
                  field.title = compile(fieldSchema.title) || t('Edit table');
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
                {t('Save')}
              </Button>
            </Space>
          </div>
        </FormProvider>
      </form>
    );
  },
);

EditTableActionContent.displayName = 'EditTableActionContent';
