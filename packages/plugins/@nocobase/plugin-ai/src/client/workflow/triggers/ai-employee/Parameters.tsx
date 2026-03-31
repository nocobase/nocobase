/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useT } from '../../../locale';
import { useForm } from '@formily/react';
import { Field, createForm } from '@formily/core';
import { ArrayItems } from '@formily/antd-v5';
import { ActionContextProvider, SchemaComponent, useActionContext, useToken } from '@nocobase/client';
import { uid } from '@formily/shared';

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    onClick: () => {
      setVisible(false);
      form.reset();
    },
  };
};

const useAddActionProps = (field: any) => {
  const form = useForm();
  const { setVisible } = useActionContext();
  return {
    onClick: async () => {
      await form.submit();
      const values = { ...form.values };
      field.value = [...field.value, values];
      setVisible(false);
      form.reset();
    },
  };
};

const useEditActionProps = (field: any, index: number) => {
  const form = useForm();
  const { setVisible } = useActionContext();
  return {
    onClick: async () => {
      await form.submit();
      const values = { ...form.values };
      field.value = field.value.map((item: any, i: number) => {
        if (i === index) {
          return values;
        }
        return item;
      });
      setVisible(false);
      form.reset();
    },
  };
};

const schema = (record?: any) => ({
  name: uid(),
  type: 'void',
  'x-component': 'Action.Modal',
  'x-decorator': 'FormV2',
  title: '{{t("Add parameter")}}',
  properties: {
    name: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      title: '{{t("Parameter name")}}',
      'x-validator': (value: string) => {
        if (!/^[a-zA-Z_]+$/.test(value)) {
          return 'a-z, A-Z, _';
        }
        return '';
      },
      required: true,
      default: record?.name,
    },
    // title: {
    //   type: 'string',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Input',
    //   title: '{{t("Parameter display name")}}',
    //   default: record?.title,
    // },
    type: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      title: '{{t("Parameter type")}}',
      required: true,
      enum: ['string', 'number', 'boolean', 'enum'],
      default: record?.type,
    },
    description: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      title: '{{t("Parameter description")}}',
      default: record?.description,
    },
    enumOptions: {
      type: 'array',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      title: '{{t("Options")}}',
      items: {
        type: 'void',
        'x-component': 'Space',
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: '{{t("Add option")}}',
          'x-component': 'ArrayItems.Addition',
        },
      },
      'x-reactions': [
        {
          dependencies: ['.type'],
          fulfill: {
            state: {
              visible: '{{$deps[0] === "enum"}}',
              required: '{{$deps[0] === "enum"}}',
            },
          },
        },
      ],
    },
    required: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': '{{t("Required")}}',
      default: record?.required,
    },
    footer: {
      type: 'void',
      'x-component': 'Action.Modal.Footer',
      properties: {
        submit: {
          title: '{{t("Submit")}}',
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
          },
          'x-use-component-props': 'useSubmitActionProps',
        },
        cancel: {
          title: '{{t("Cancel")}}',
          'x-component': 'Action',
          'x-use-component-props': 'useCancelActionProps',
        },
      },
    },
  },
});

export const Parameter: React.FC = () => {
  const t = useT();
  const record = ArrayItems.useRecord();
  const { name, type, required } = record || {};
  const { token } = useToken();
  return (
    <Space size="middle">
      <div
        style={{
          marginLeft: 16,
          fontWeight: token.fontWeightStrong,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: token.fontSizeSM,
          color: token.colorTextDescription,
        }}
      >
        {type}
      </div>
      {required && (
        <div
          style={{
            color: token.colorError,
            fontSize: token.fontSizeSM,
          }}
        >
          {t('required')}
        </div>
      )}
    </Space>
  );
};

export const ParameterAddition: React.FC = () => {
  const t = useT();
  const form = useForm();
  const field = form.query('parameters').take() as Field;
  const [visible, setVisible] = useState(false);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Button
        variant="dashed"
        color="default"
        style={{
          width: '100%',
        }}
        icon={<PlusOutlined />}
        onClick={() => setVisible(true)}
      >
        {t('Add parameter')}
      </Button>
      <SchemaComponent
        schema={schema()}
        scope={{
          t,
          useCancelActionProps,
          useSubmitActionProps: () => useAddActionProps(field),
        }}
      />
    </ActionContextProvider>
  );
};

export const EditParameter: React.FC = () => {
  const t = useT();
  const form = useForm();
  const field = form.query('parameters').take() as Field;
  const [visible, setVisible] = useState(false);
  const index = ArrayItems.useIndex();
  const record = ArrayItems.useRecord();

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Button icon={<EditOutlined />} onClick={() => setVisible(true)} variant="link" color="default" />
      <SchemaComponent
        schema={schema(record)}
        scope={{ t, useCancelActionProps, useSubmitActionProps: () => useEditActionProps(field, index) }}
      />
    </ActionContextProvider>
  );
};

export const ParameterDesc: React.FC = () => {
  const record = ArrayItems.useRecord();
  if (!record?.description) {
    return null;
  }
  return (
    <Tooltip title={record.description}>
      <QuestionCircleOutlined />
    </Tooltip>
  );
};
