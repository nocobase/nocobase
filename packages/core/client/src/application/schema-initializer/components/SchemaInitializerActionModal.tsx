/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import React, { FC, useCallback, useMemo } from 'react';
import { useActionContext, SchemaComponent } from '../../../schema-component';
import { useSchemaInitializer, useSchemaInitializerItem } from '../context';
import { SchemaInitializerItem } from './SchemaInitializerItem';
import { uid } from '@formily/shared';

export interface SchemaInitializerActionModalProps {
  title: string;
  icon?: string | React.ReactNode;
  schema: any;
  onCancel?: () => void;
  onSubmit?: (values: any) => Promise<any> | void;
  buttonText?: any;
  component?: any;
  isItem?: boolean;
  width?: string;
  btnStyles?: React.CSSProperties;
}

const SchemaInitializerActionModalItemComponent = React.forwardRef((props: any, ref: any) => {
  const { onClick, ...others } = props;
  return <SchemaInitializerItem ref={ref} {...others} onClick={(e) => onClick?.(e.event, false)} />;
});

export const SchemaInitializerActionModal: FC<SchemaInitializerActionModalProps> = (props) => {
  const { title, icon, width, schema, buttonText, btnStyles, isItem, component, onCancel, onSubmit } = props;
  const { setVisible: initializerSetVisible } = useSchemaInitializer();
  const useCancelAction = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useActionContext();
    return {
      async run() {
        await onCancel?.();
        ctx.setVisible(false);
        void form.reset();
      },
    };
  }, [onCancel]);

  const useSubmitAction = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useActionContext();
    return {
      async run() {
        await form.validate();
        try {
          await onSubmit?.(form.values);
          ctx.setVisible(false);
          void form.reset();
        } catch (err) {
          console.error(err);
        }
      },
    };
  }, [onSubmit]);

  const ItemComponent = useMemo(
    () =>
      React.forwardRef(({ onClick }: any, ref) => {
        return <SchemaInitializerActionModalItemComponent onClick={onClick} ref={ref} title={buttonText} icon={icon} />;
      }),
    [buttonText, icon],
  );

  const schemaId = useMemo(() => uid(), []);

  const defaultSchema = useMemo(() => {
    return {
      type: 'void',
      properties: {
        [schemaId]: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': component
            ? {
                component,
                icon,
              }
            : isItem
              ? {
                  component: ItemComponent,
                }
              : {
                  icon: icon || 'PlusOutlined',
                  style: {
                    borderColor: 'var(--colorSettings)',
                    color: 'var(--colorSettings)',
                    ...(btnStyles || {}),
                  },
                  title: buttonText,
                  type: 'dashed',
                },
          properties: {
            drawer1: {
              'x-decorator': 'Form',
              'x-component': 'Action.Modal',
              'x-component-props': {
                width: width,
                style: {
                  maxWidth: width ? width : '520px',
                  width: '100%',
                },
                afterOpenChange: () => {
                  initializerSetVisible(false);
                },
              },
              type: 'void',
              title,
              properties: {
                ...(schema?.properties || schema),
                footer: {
                  'x-component': 'Action.Modal.Footer',
                  type: 'void',
                  properties: {
                    cancel: {
                      title: '{{t("Cancel")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction: useCancelAction,
                      },
                    },
                    submit: {
                      title: '{{t("Submit")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: useSubmitAction,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }, [buttonText, component, schemaId, schema, title, useCancelAction, useSubmitAction]);

  return <SchemaComponent schema={defaultSchema as any} />;
};

export const SchemaInitializerActionModalInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerActionModalProps>();
  return <SchemaInitializerActionModal {...itemConfig} />;
};
