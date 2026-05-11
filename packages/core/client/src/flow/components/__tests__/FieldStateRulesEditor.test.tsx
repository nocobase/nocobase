/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@nocobase/test/client';
import { FieldStateRulesEditor } from '../FieldStateRulesEditor';
import type { FieldStateRuleItem } from '../FieldStateRulesEditor';

vi.mock('../ConditionBuilder', async () => {
  const actual = await vi.importActual<typeof import('../ConditionBuilder')>('../ConditionBuilder');
  return {
    ...actual,
    ConditionBuilder: (props: any) => (
      <div data-testid="mock-condition-builder" data-extra={props?.extraMetaTree ? 'yes' : 'no'} />
    ),
  };
});

describe('FieldStateRulesEditor', () => {
  const t = (key: string) => key;
  const stateOptions = [
    { label: 'Visible', value: 'visible' as const },
    { label: 'Hidden', value: 'hidden' as const },
    { label: 'Hidden (reserved value)', value: 'hiddenReservedValue' as const },
    { label: 'Required', value: 'required' as const },
    { label: 'Not required', value: 'notRequired' as const },
    { label: 'Disabled', value: 'disabled' as const },
    { label: 'Enabled', value: 'enabled' as const },
  ];

  const wrap = (ui: React.ReactElement) => (
    <ConfigProvider>
      <App>{ui}</App>
    </ConfigProvider>
  );

  it('injects current item variables into the condition for association sub-fields', () => {
    const roleCollection = {
      getField: (name: string) =>
        name === 'name'
          ? { name: 'name', title: 'Name', type: 'string', interface: 'input', isAssociationField: () => false }
          : null,
      getFields: () => [
        { name: 'name', title: 'Name', type: 'string', interface: 'input', isAssociationField: () => false },
      ],
    };
    const rolesField = {
      name: 'roles',
      title: 'Roles',
      type: 'hasMany',
      interface: 'o2m',
      isAssociationField: () => true,
      targetCollection: roleCollection,
    };
    const rootCollection = {
      getField: (name: string) => (name === 'roles' ? rolesField : null),
      getFields: () => [rolesField],
    };
    const value: FieldStateRuleItem[] = [
      {
        key: 'rule-1',
        enable: true,
        targetPath: 'roles.name',
        state: 'hidden',
        condition: { logic: '$and', items: [] },
      },
    ];

    const { getByTestId } = render(
      wrap(
        <FieldStateRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={value}
          stateOptions={stateOptions}
        />,
      ),
    );

    expect(getByTestId('mock-condition-builder').getAttribute('data-extra')).toBe('yes');
  });
});
