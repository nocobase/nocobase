/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import {
  Action,
  ActionContextProvider,
  ISchema,
  SchemaComponent,
  SchemaInitializerItem,
  useSchemaInitializer,
} from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import React, { useMemo, useState } from 'react';

export function ModalActionSchemaInitializerItem(props) {
  const { modalSchema = {}, components = {}, ...otherProps } = props;
  const { properties, ...others } = modalSchema;
  const [visible, setVisible] = useState(false);
  const { setVisible: setSchemaInitializerVisible } = useSchemaInitializer();

  const schema: ISchema = useMemo(() => {
    return {
      name: uid(),
      'x-component': 'Action.Modal',
      'x-component-props': {
        width: '520px',
      },
      type: 'void',
      'x-decorator': 'FormV2',
      'x-decorator-props': {},
      ...others,
      properties: {
        ...properties,
        footer1: {
          'x-component': 'Action.Modal.Footer',
          type: 'void',
          properties: {
            close: {
              title: 'Cancel',
              'x-component': 'Action',
              'x-component-props': {
                type: 'default',
              },
              'x-use-component-props': () => {
                return {
                  onClick() {
                    setVisible(false);
                    props?.onCancel?.();
                  },
                };
              },
            },
            submit: {
              title: 'OK',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
              'x-use-component-props': () => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const form = useForm();
                return {
                  async onClick() {
                    await form.submit();
                    setVisible(false);
                    props?.onSubmit?.(form.values);
                  },
                };
              },
            },
          },
        },
      },
    };
  }, [visible]);

  return (
    <>
      <SchemaInitializerItem
        {...otherProps}
        onClick={(e) => {
          setSchemaInitializerVisible(false);
          setVisible(true);
          props?.onClick?.(e);
        }}
      />
      <ActionContextProvider value={{ visible, setVisible }}>
        <SchemaComponent components={{ Action, ...components }} schema={schema} />
      </ActionContextProvider>
    </>
  );
}
