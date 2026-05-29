/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PasswordInput, ResourceFormDrawer } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Col, Form, Input, Row, Select } from 'antd';
import React from 'react';
import { useT } from '../locale';
import { PluginUsersClientV2 } from '../plugin';
import { generatePassword } from '../../shared/generatePassword';
import type { Role, User } from './types';
import { toListPayload } from './types';

interface UserFormValues {
  nickname?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
}

export interface UserFormDrawerProps {
  user?: User;
  onSubmitted: () => Promise<void> | void;
}

export default function UserFormDrawer(props: UserFormDrawerProps) {
  const ctx = useFlowContext();
  const t = useT();
  const isEdit = !!props.user;

  const rolesService = useRequest(async () => {
    const response = await ctx.api.resource('roles').list({
      paginate: false,
      showAnonymous: true,
      filter: { 'name.$ne': 'root' },
    });
    return toListPayload<Role>(response?.data).data ?? [];
  });

  const validatePassword = useMemoizedFn(async (_rule: unknown, value: unknown) => {
    if (isEdit || typeof value !== 'string' || !value) {
      return;
    }
    const plugin = ctx.app.pm.get(PluginUsersClientV2) as PluginUsersClientV2 | undefined;
    const validators = plugin?.getPasswordValidators?.() ?? [];
    for (const validator of validators) {
      const message = await validator(value, { username: undefined });
      if (message) {
        throw new Error(message);
      }
    }
  });

  return (
    <ResourceFormDrawer<UserFormValues>
      title={isEdit ? t('Edit profile') : t('Add user')}
      initialValues={
        props.user
          ? {
              nickname: props.user.nickname,
              username: props.user.username,
              email: props.user.email,
              phone: props.user.phone,
              roles: props.user.roles?.map((role) => role.name),
            }
          : {}
      }
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={async (values) => {
        const nextValues = {
          ...values,
          roles: values.roles?.map((name) => ({ name })),
        };
        if (isEdit && props.user?.id != null) {
          await ctx.api.resource('users').update({
            filterByTk: props.user.id,
            values: nextValues,
          });
          return;
        }
        await ctx.api.resource('users').create({ values: nextValues });
      }}
      onSubmitted={async () => {
        ctx.message.success(t('Saved successfully'));
        await props.onSubmitted();
      }}
    >
      {({ form }) => (
        <>
          <Form.Item name="nickname" label={t('Nickname')}>
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="username"
            label={t('Username')}
            rules={[{ required: true, message: t('Username is required') }]}
          >
            <Input autoComplete="username" disabled={isEdit} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('Email')}
            rules={[{ type: 'email', message: t('Please enter a valid email address') }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="phone" label={t('Phone')}>
            <Input autoComplete="tel" />
          </Form.Item>
          {isEdit ? null : (
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
          <Form.Item name="roles" label={t('Roles')}>
            <Select
              mode="multiple"
              loading={rolesService.loading}
              options={(rolesService.data ?? [])
                .filter((role) => role.name !== 'root')
                .map((role) => ({ value: role.name, label: t(role.title) }))}
            />
          </Form.Item>
        </>
      )}
    </ResourceFormDrawer>
  );
}
