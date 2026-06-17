/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { MessageConfigFormProps } from '@nocobase/plugin-notification-manager/client-v2';
import { WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';
import { Button, Flex, Form, Radio } from 'antd';
import React from 'react';
import { useNotificationEmailTranslation } from '../locale';

function withPrefix(namePrefix: Array<string | number> | undefined, ...segments: Array<string | number>) {
  return [...(namePrefix ?? []), ...segments];
}

type AddressListProps = {
  formPath: Array<string | number>;
  title: string;
  addLabel: string;
  placeholder: string;
  requiredMessage: string;
  required?: boolean;
};

function AddressList(props: AddressListProps) {
  const { formPath, title, addLabel, placeholder, required, requiredMessage } = props;

  return (
    <Form.List
      name={formPath}
      rules={
        required
          ? [
              {
                validator: async (_rule, value) => {
                  if (Array.isArray(value) && value.filter(Boolean).length > 0) {
                    return;
                  }
                  throw new Error(requiredMessage);
                },
              },
            ]
          : undefined
      }
    >
      {(fields, { add, remove }, { errors }) => (
        <Form.Item
          label={title}
          required={required}
          validateStatus={errors.length ? 'error' : undefined}
          help={errors[0]}
        >
          <Flex vertical gap="small">
            {fields.map((field) => (
              <Flex key={field.key} gap="small" align="flex-start">
                <Form.Item name={field.name} noStyle>
                  <WorkflowVariableInput placeholder={placeholder} variableOptions={{ types: ['string'] }} />
                </Form.Item>
                <Button type="text" aria-label={title} icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
              </Flex>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => add('')}>
              {addLabel}
            </Button>
          </Flex>
        </Form.Item>
      )}
    </Form.List>
  );
}

export function MessageConfigForm(props: MessageConfigFormProps) {
  const { t } = useNotificationEmailTranslation();
  const contentType = Form.useWatch(withPrefix(props.namePrefix, 'contentType')) ?? 'html';

  return (
    <>
      <AddressList
        formPath={withPrefix(props.namePrefix, 'to')}
        title={t('To')}
        addLabel={t('Add email address')}
        placeholder={t('Email address')}
        requiredMessage={t('The field value is required')}
        required
      />
      <AddressList
        formPath={withPrefix(props.namePrefix, 'cc')}
        title={t('CC')}
        addLabel={t('Add email address')}
        placeholder={t('Email address')}
        requiredMessage={t('The field value is required')}
      />
      <AddressList
        formPath={withPrefix(props.namePrefix, 'bcc')}
        title={t('BCC')}
        addLabel={t('Add email address')}
        placeholder={t('Email address')}
        requiredMessage={t('The field value is required')}
      />
      <Form.Item
        name={withPrefix(props.namePrefix, 'subject')}
        label={t('Subject')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <WorkflowVariableInput />
      </Form.Item>
      <Form.Item name={withPrefix(props.namePrefix, 'contentType')} label={t('Content type')} initialValue="html">
        <Radio.Group
          options={[
            { label: 'HTML', value: 'html' },
            { label: t('Plain text'), value: 'text' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'html')}
        label={t('Content')}
        hidden={contentType !== 'html'}
        rules={contentType === 'html' ? [{ required: true, message: t('The field value is required') }] : undefined}
      >
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'text')}
        label={t('Content')}
        hidden={contentType !== 'text'}
        rules={contentType === 'text' ? [{ required: true, message: t('The field value is required') }] : undefined}
      >
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," />
      </Form.Item>
    </>
  );
}

export default MessageConfigForm;
