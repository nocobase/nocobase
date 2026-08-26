/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PasswordInput } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Button, Col, Form, Row } from 'antd';
import React from 'react';
import { ResourceFormDrawer } from '../components/resource';
import { useT } from '../locale';
import { PluginUsersClientV2 } from '../plugin';
import { generatePassword } from '../shared/generatePassword';
import type { User } from './types';

interface ChangePasswordValues {
  password: string;
}

export interface ChangeUserPasswordDrawerProps {
  user: User;
  onSubmitted: () => Promise<void> | void;
}

export default function ChangeUserPasswordDrawer(props: ChangeUserPasswordDrawerProps) {
  const ctx = useFlowContext();
  const t = useT();

  const validatePassword = useMemoizedFn(async (_rule: unknown, value: unknown) => {
    if (typeof value !== 'string' || !value) {
      return;
    }
    const plugin = ctx.app.pm.get(PluginUsersClientV2) as PluginUsersClientV2 | undefined;
    const validators = plugin?.getPasswordValidators?.() ?? [];
    for (const validator of validators) {
      const message = await validator(value, { username: props.user.username });
      if (message) {
        throw new Error(message);
      }
    }
  });

  return (
    <ResourceFormDrawer<ChangePasswordValues>
      title={t('Change password')}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={async (values) => {
        await ctx.api.resource('users').update({
          filterByTk: props.user.id,
          values,
        });
      }}
      onSubmitted={async () => {
        ctx.message.success(t('Saved successfully'));
        await props.onSubmitted();
      }}
    >
      {({ form }) => (
        <Form.Item label={t('Password')} required>
          <Row gutter={8}>
            <Col span={18}>
              <Form.Item
                name="password"
                noStyle
                rules={[{ required: true, message: t('Password is required') }, { validator: validatePassword }]}
              >
                <PasswordInput autoComplete="new-password" checkStrength />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Button
                onClick={() => {
                  form.setFieldsValue({ password: generatePassword() });
                }}
              >
                {t('Random password')}
              </Button>
            </Col>
          </Row>
        </Form.Item>
      )}
    </ResourceFormDrawer>
  );
}
