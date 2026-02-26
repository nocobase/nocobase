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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { FieldAssignRulesEditor, type FieldAssignRuleItem } from '../FieldAssignRulesEditor';
import { mergeItemMetaTreeForAssignValue } from '../FieldAssignValueInput';

const { mockFieldAssignValueInput } = vi.hoisted(() => ({
  mockFieldAssignValueInput: vi.fn((props: any) => (
    <div
      data-testid="mock-value-input"
      data-extra={Array.isArray(props?.extraMetaTree) ? 'yes' : 'no'}
      data-assoc-label={String(props?.associationFieldNamesOverride?.label || '')}
      data-assoc-value={String(props?.associationFieldNamesOverride?.value || '')}
      data-date-constant={props?.enableDateVariableAsConstant ? 'yes' : 'no'}
    />
  )),
}));

vi.mock('../FieldAssignValueInput', async () => {
  const actual = await vi.importActual<typeof import('../FieldAssignValueInput')>('../FieldAssignValueInput');
  return {
    ...actual,
    FieldAssignValueInput: mockFieldAssignValueInput,
  };
});

vi.mock('../ConditionBuilder', async () => {
  const actual = await vi.importActual<typeof import('../ConditionBuilder')>('../ConditionBuilder');
  return {
    ...actual,
    ConditionBuilder: (props: any) => (
      <div data-testid="mock-condition-builder" data-extra={props?.extraMetaTree ? 'yes' : 'no'} />
    ),
  };
});

describe('FieldAssignRulesEditor', () => {
  const t = (key: string) => key;
  const wrap = (ui: React.ReactElement) => (
    <ConfigProvider>
      <App>{ui}</App>
    </ConfigProvider>
  );

  beforeEach(() => {
    mockFieldAssignValueInput.mockClear();
  });

  const createAssociationFixture = () => {
    const profileCollection = {
      titleField: 'name',
      filterTargetKey: 'id',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
          interface: 'input',
        },
        {
          name: 'nickname',
          title: 'Nickname',
          interface: 'input',
        },
      ],
    };

    const profileField: any = {
      name: 'profile',
      title: 'Profile',
      type: 'belongsTo',
      interface: 'm2o',
      targetKey: 'id',
      isAssociationField: () => true,
      targetCollection: profileCollection,
    };

    const rootCollection = {
      getField: (name: string) => (name === 'profile' ? profileField : null),
      getFields: () => [profileField],
    };

    const value: FieldAssignRuleItem[] = [
      {
        key: 'rule-profile',
        enable: true,
        targetPath: 'profile',
        mode: 'assign',
      },
    ];

    return {
      profileCollection,
      rootCollection,
      value,
    };
  };

  const openAdvancedPanel = async () => {
    await userEvent.click(screen.getByRole('button', { name: /Advanced/i }));
    await screen.findByText('Title field');
  };

  const getAdvancedPopover = (): HTMLElement => {
    const popover = screen.getByText('Title field').closest('.ant-popover') as HTMLElement | null;
    expect(popover).not.toBeNull();
    return popover as HTMLElement;
  };

  const selectTitleFieldOption = async (label: string) => {
    const selector = getAdvancedPopover().querySelector('.ant-select-selector') as HTMLElement | null;
    expect(selector).not.toBeNull();
    await userEvent.click(selector as HTMLElement);
    await userEvent.click(await screen.findByText(label));
  };

  const getSyncTitleFieldButtons = (): HTMLButtonElement[] =>
    Array.from(document.body.querySelectorAll('button[aria-label="Sync title field"]')) as HTMLButtonElement[];

  it('shows title field quick controls for association target and supports preview override', async () => {
    const { rootCollection, value } = createAssociationFixture();

    const onSyncAssociationTitleField = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={value}
          showCondition={false}
          isTitleFieldCandidate={() => true}
          onSyncAssociationTitleField={onSyncAssociationTitleField}
        />,
      ),
    );

    expect(container.textContent).toContain('Advanced');
    expect(screen.queryByText('Title field')).toBeNull();

    const initialCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(initialCall?.associationFieldNamesOverride).toEqual({ label: 'name', value: 'id' });

    await openAdvancedPanel();
    await selectTitleFieldOption('Nickname');

    const afterSelectCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(afterSelectCall?.associationFieldNamesOverride).toEqual({ label: 'nickname', value: 'id' });

    const syncButtons = getSyncTitleFieldButtons();
    expect(syncButtons.length).toBeGreaterThan(0);
    await userEvent.click(syncButtons[0] as HTMLElement);
    await userEvent.click(await screen.findByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(onSyncAssociationTitleField).toHaveBeenCalledWith(
        expect.objectContaining({
          titleField: 'nickname',
          targetPath: 'profile',
        }),
      );
    });
  });

  it('saves selected title field into current assign rule without syncing', async () => {
    const { rootCollection, value } = createAssociationFixture();
    const onChange = vi.fn();

    const ControlledEditor = () => {
      const [rules, setRules] = React.useState<FieldAssignRuleItem[]>(value);
      return (
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={rules}
          onChange={(next) => {
            setRules(next);
            onChange(next);
          }}
          showCondition={false}
          isTitleFieldCandidate={() => true}
        />
      );
    };

    render(wrap(<ControlledEditor />));

    await openAdvancedPanel();
    await selectTitleFieldOption('Nickname');

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as FieldAssignRuleItem[];
      expect(lastCall?.[0]?.valueTitleField).toBe('nickname');
    });

    const latestInputCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(latestInputCall?.associationFieldNamesOverride).toEqual({ label: 'nickname', value: 'id' });
  });

  it('restores preview from persisted valueTitleField on rerender', () => {
    const { rootCollection, value } = createAssociationFixture();
    const persistedValue: FieldAssignRuleItem[] = [
      {
        ...value[0],
        valueTitleField: 'nickname',
      },
    ];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={persistedValue}
          showCondition={false}
          isTitleFieldCandidate={() => true}
        />,
      ),
    );

    const latestInputCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(latestInputCall?.associationFieldNamesOverride).toEqual({ label: 'nickname', value: 'id' });
  });

  it('falls back to current title field when persisted valueTitleField is stale', async () => {
    const { rootCollection, value } = createAssociationFixture();
    const onSyncAssociationTitleField = vi.fn().mockResolvedValue(undefined);

    const staleValue: FieldAssignRuleItem[] = [
      {
        ...value[0],
        valueTitleField: 'deletedField',
      },
    ];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={staleValue}
          showCondition={false}
          isTitleFieldCandidate={() => true}
          onSyncAssociationTitleField={onSyncAssociationTitleField}
        />,
      ),
    );

    const latestInputCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(latestInputCall?.associationFieldNamesOverride).toEqual({ label: 'name', value: 'id' });

    await openAdvancedPanel();
    const syncButtons = getSyncTitleFieldButtons();
    expect(syncButtons.length).toBeGreaterThan(0);
    expect((syncButtons[0] as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(syncButtons[0] as HTMLElement);

    expect(onSyncAssociationTitleField).not.toHaveBeenCalled();
  });

  it('clears rule-level valueTitleField when sync succeeds', async () => {
    const { rootCollection, value } = createAssociationFixture();
    const onChange = vi.fn();
    const onSyncAssociationTitleField = vi.fn().mockImplementation(async ({ targetCollection, titleField }) => {
      targetCollection.titleField = titleField;
    });

    const ControlledEditor = () => {
      const [rules, setRules] = React.useState<FieldAssignRuleItem[]>(value);
      return (
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={rules}
          onChange={(next) => {
            setRules(next);
            onChange(next);
          }}
          showCondition={false}
          isTitleFieldCandidate={() => true}
          onSyncAssociationTitleField={onSyncAssociationTitleField}
        />
      );
    };

    render(wrap(<ControlledEditor />));

    await openAdvancedPanel();
    await selectTitleFieldOption('Nickname');

    const syncButtons = getSyncTitleFieldButtons();
    await userEvent.click(syncButtons[0] as HTMLElement);
    await userEvent.click(await screen.findByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(onSyncAssociationTitleField).toHaveBeenCalledWith(
        expect.objectContaining({
          titleField: 'nickname',
          targetPath: 'profile',
        }),
      );
    });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as FieldAssignRuleItem[];
      expect(lastCall?.[0]?.valueTitleField).toBeUndefined();
    });
  });

  it('keeps rule-level title field override when sync fails', async () => {
    const { rootCollection, value } = createAssociationFixture();
    const onChange = vi.fn();

    const onSyncAssociationTitleField = vi.fn().mockRejectedValue(new Error('sync failed'));

    const ControlledEditor = () => {
      const [rules, setRules] = React.useState<FieldAssignRuleItem[]>(value);
      return (
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={rules}
          onChange={(next) => {
            setRules(next);
            onChange(next);
          }}
          showCondition={false}
          isTitleFieldCandidate={() => true}
          onSyncAssociationTitleField={onSyncAssociationTitleField}
        />
      );
    };

    render(wrap(<ControlledEditor />));

    await openAdvancedPanel();
    await selectTitleFieldOption('Nickname');

    let lastCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(lastCall?.associationFieldNamesOverride?.label).toBe('nickname');

    const syncButtons = getSyncTitleFieldButtons();
    await userEvent.click(syncButtons[0] as HTMLElement);
    await userEvent.click(await screen.findByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(onSyncAssociationTitleField).toHaveBeenCalled();
    });

    const latestRule = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as FieldAssignRuleItem[];
    expect(latestRule?.[0]?.valueTitleField).toBe('nickname');

    lastCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(lastCall?.associationFieldNamesOverride?.label).toBe('nickname');
  });

  it('uses collection options titleField as default value', () => {
    const profileCollection = {
      options: {
        titleField: 'nickname',
      },
      filterTargetKey: 'id',
      getFields: () => [
        {
          name: 'name',
          title: 'Name',
          interface: 'input',
        },
        {
          name: 'nickname',
          title: 'Nickname',
          interface: 'input',
        },
      ],
    };

    const profileField: any = {
      name: 'profile',
      title: 'Profile',
      type: 'belongsTo',
      interface: 'm2o',
      targetKey: 'id',
      isAssociationField: () => true,
      targetCollection: profileCollection,
    };

    const rootCollection = {
      getField: (name: string) => (name === 'profile' ? profileField : null),
      getFields: () => [profileField],
    };

    const value: FieldAssignRuleItem[] = [
      {
        key: 'rule-profile',
        enable: true,
        targetPath: 'profile',
        mode: 'assign',
      },
    ];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={value}
          showCondition={false}
          isTitleFieldCandidate={() => true}
        />,
      ),
    );

    const latestInputCall = mockFieldAssignValueInput.mock.calls[mockFieldAssignValueInput.mock.calls.length - 1]?.[0];
    expect(latestInputCall?.associationFieldNamesOverride).toEqual({ label: 'nickname', value: 'id' });
  });

  it('shows no Advanced button for variable expression value', () => {
    const { rootCollection, value } = createAssociationFixture();
    const variableValue: FieldAssignRuleItem[] = [
      {
        ...value[0],
        value: '{{ ctx.user.name }}',
      },
    ];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={variableValue}
          showCondition={false}
          isTitleFieldCandidate={() => true}
        />,
      ),
    );

    expect(screen.queryByRole('button', { name: /Advanced/i })).toBeNull();
  });

  it('does not show title field quick controls for non-association field', () => {
    const titleField: any = {
      name: 'title',
      title: 'Title',
      interface: 'input',
      isAssociationField: () => false,
    };
    const rootCollection = {
      getField: (name: string) => (name === 'title' ? titleField : null),
      getFields: () => [titleField],
    };

    const value: FieldAssignRuleItem[] = [{ key: 'rule-title', enable: true, targetPath: 'title', mode: 'assign' }];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          rootCollection={rootCollection}
          value={value}
          showCondition={false}
        />,
      ),
    );

    expect(screen.queryByRole('button', { name: /Advanced/i })).toBeNull();
  });

  it('defaults to expand the last enabled item', () => {
    const value: FieldAssignRuleItem[] = [
      { key: '1', enable: false, targetPath: 'a', mode: 'assign' },
      { key: '2', enable: true, targetPath: 'b', mode: 'assign' },
      { key: '3', enable: true, targetPath: 'c', mode: 'assign' },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} />),
    );

    const active = container.querySelector('.ant-collapse-item-active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('c');
  });

  it('falls back to expand the first item when all items are disabled', () => {
    const value: FieldAssignRuleItem[] = [
      { key: '1', enable: false, targetPath: 'a', mode: 'assign' },
      { key: '2', enable: false, targetPath: 'b', mode: 'assign' },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} />),
    );

    const active = container.querySelector('.ant-collapse-item-active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('a');
  });

  it('uses extra item tree only in value editor', () => {
    const userCollection = {
      getField: () => null,
      getFields: () => [
        {
          name: 'nickname',
          title: 'Nickname',
          type: 'string',
          interface: 'input',
          isAssociationField: () => false,
        },
      ],
    };
    const m2oField: any = {
      name: 'Created_By',
      title: 'Created_By',
      type: 'belongsTo',
      interface: 'm2o',
      isAssociationField: () => true,
      targetCollection: userCollection,
    };
    const m2mCollection: any = {
      getField: (name: string) => (name === 'Created_By' ? m2oField : null),
      getFields: () => [m2oField],
    };
    const m2mField: any = {
      name: 'm2m',
      title: 'm2m',
      type: 'belongsToMany',
      interface: 'm2m',
      isAssociationField: () => true,
      targetCollection: m2mCollection,
    };
    const rootCollection = {
      getField: (name: string) => (name === 'm2m' ? m2mField : null),
      getFields: () => [m2mField],
    };

    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'm2m.Created_By',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
      },
    ];

    const { getByTestId } = render(
      wrap(
        <FieldAssignRulesEditor t={t} fieldOptions={[]} rootCollection={rootCollection} value={value} showCondition />,
      ),
    );

    expect(getByTestId('mock-value-input').getAttribute('data-extra')).toBe('yes');
    expect(getByTestId('mock-condition-builder').getAttribute('data-extra')).toBe('yes');
  });

  it('renders empty state when no items', () => {
    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={[]} showCondition={false} />),
    );

    expect(container.querySelector('.ant-collapse')).toBeNull();
    expect(container.textContent).toContain('No data');
  });

  it('renders assignment mode as radios and supports mode switching', async () => {
    const onChange = vi.fn();
    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'title',
        mode: 'assign',
      },
    ];

    render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          value={value}
          onChange={onChange}
          showCondition={false}
          showEnable={false}
        />,
      ),
    );

    expect(screen.getByLabelText('Default value')).toBeInTheDocument();
    expect(screen.getByLabelText('Fixed value')).toBeInTheDocument();
    expect(screen.getByLabelText('Fixed value')).toBeChecked();
    await userEvent.click(screen.getByLabelText('Default value'));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as FieldAssignRuleItem[];
    expect(lastCall?.[0]?.mode).toBe('default');
  });

  it('shows assignment mode tooltips for each option', async () => {
    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'title',
        mode: 'assign',
      },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} showEnable={false} />),
    );

    const questionIcons = Array.from(container.querySelectorAll('.anticon-question-circle'));
    expect(questionIcons).toHaveLength(2);

    await userEvent.hover(questionIcons[0] as Element);
    await waitFor(() => {
      expect(
        screen.getByText(
          'A pre-filled value. Editable, for new entries only, and won’t affect existing data (including empty values).',
        ),
      ).toBeInTheDocument();
    });

    await userEvent.unhover(questionIcons[0] as Element);

    await userEvent.hover(questionIcons[1] as Element);
    await waitFor(() => {
      expect(screen.getByText('A system-set value. Read-only.')).toBeInTheDocument();
    });
  });

  it('merges extra item tree into base item while keeping order', () => {
    const base: MetaTreeNode[] = [
      { name: 'formValues', title: 'Current form', type: 'object', paths: ['formValues'] },
      {
        name: 'item',
        title: 'Current item（o2m）',
        type: 'object',
        paths: ['item'],
        children: [
          {
            name: 'attributes',
            title: 'Attributes',
            type: 'object',
            paths: ['item', 'value'],
          },
        ],
      },
      { name: 'user', title: 'Current user', type: 'object', paths: ['user'] },
    ];
    const extra: MetaTreeNode[] = [
      {
        name: 'item',
        title: 'Current item（Created By）',
        type: 'object',
        paths: ['item'],
        children: [
          {
            name: 'attributes',
            title: 'Attributes',
            type: 'object',
            paths: ['item', 'value'],
          },
          {
            name: 'parentItem',
            title: 'Parent item（m2m）',
            type: 'object',
            paths: ['item', 'parentItem'],
            children: [
              { name: 'index', title: 'Index (starts from 0)', type: 'number', paths: ['item', 'parentItem', 'index'] },
              {
                name: 'attributes',
                title: 'Attributes',
                type: 'object',
                paths: ['item', 'parentItem', 'value'],
              },
            ],
          },
        ],
      },
    ];

    const merged = mergeItemMetaTreeForAssignValue(base, extra);
    expect(merged.map((node) => node.name)).toEqual(['formValues', 'item', 'user']);
    expect(merged.filter((node) => node.name === 'item')).toHaveLength(1);

    const itemNode = merged.find((node) => node.name === 'item')!;
    const parent = (itemNode.children as MetaTreeNode[]).find((node) => node.name === 'parentItem');
    expect(parent).toBeTruthy();

    const nestedParent = ((parent?.children as MetaTreeNode[]) || []).find((node) => node.name === 'parentItem');
    expect(nestedParent).toBeTruthy();
    expect(nestedParent?.paths).toEqual(['item', 'parentItem']);
    expect(nestedParent?.title).toBe('Parent item（o2m）');
  });

  it('keeps base tree when extra has no item node', () => {
    const base: MetaTreeNode[] = [
      { name: 'formValues', title: 'Current form', type: 'object', paths: ['formValues'] },
      { name: 'item', title: 'Current item', type: 'object', paths: ['item'] },
    ];
    const extra: MetaTreeNode[] = [
      { name: 'collection', title: 'Current collection', type: 'object', paths: ['collection'] },
    ];

    const merged = mergeItemMetaTreeForAssignValue(base, extra);
    expect(merged).toEqual(base);
  });

  it('passes enableDateVariableAsConstant to value input', () => {
    const value: FieldAssignRuleItem[] = [
      {
        key: '1',
        enable: true,
        targetPath: 'createdAt',
        mode: 'assign',
      },
    ];

    const { getByTestId } = render(
      wrap(
        <FieldAssignRulesEditor
          t={t}
          fieldOptions={[]}
          value={value}
          showCondition={false}
          enableDateVariableAsConstant
        />,
      ),
    );

    expect(getByTestId('mock-value-input').getAttribute('data-date-constant')).toBe('yes');
  });
});
