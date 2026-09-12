/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnvVariableInput, TypedVariableInput } from '@nocobase/client-v2';
import { Col, Form, Row, Select } from 'antd';
import React from 'react';
import { useNotificationEmailTranslation } from '../locale';

export function ChannelConfigForm() {
  const { t } = useNotificationEmailTranslation();

  return (
    <>
      <Form.Item
        label={t('Transport')}
        name={['options', 'transport']}
        initialValue="smtp"
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <Select options={[{ value: 'smtp', label: 'SMTP' }]} />
      </Form.Item>

      <Row gutter={16}>
        <Col span={11}>
          <Form.Item
            label={t('Host')}
            name={['options', 'host']}
            extra={t('SMTP server host')}
            rules={[{ required: true, message: t('The field value is required') }]}
          >
            <EnvVariableInput placeholder="smtp.example.com" />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item
            label={t('Port')}
            name={['options', 'port']}
            initialValue={465}
            rules={[{ required: true, message: t('The field value is required') }]}
          >
            <TypedVariableInput types={[['number', { min: 1, max: 65535, step: 1 }]]} namespaces={['$env']} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={t('Secure')}
            name={['options', 'secure']}
            initialValue={true}
            extra={t('In most cases, if using port 465, set it to true; otherwise, set it to false.')}
          >
            <TypedVariableInput types={['boolean']} namespaces={['$env']} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={t('Account')}
            name={['options', 'account']}
            rules={[{ required: true, message: t('The field value is required') }]}
          >
            <EnvVariableInput placeholder="example@domain.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('Password')}
            name={['options', 'password']}
            rules={[{ required: true, message: t('The field value is required') }]}
          >
            <EnvVariableInput password />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label={t('From')}
        name={['options', 'from']}
        extra={t('The email address that will be used as the sender')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <EnvVariableInput placeholder="noreply <example@domain.com>" />
      </Form.Item>
    </>
  );
}

export default ChannelConfigForm;
