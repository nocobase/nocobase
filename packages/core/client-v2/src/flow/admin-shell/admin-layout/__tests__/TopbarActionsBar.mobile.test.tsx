/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Drawer, Input } from 'antd';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/flow-engine', () => ({
  FlowModel: class {
    uid: string;
    context = { t: (value: string) => value };

    constructor(options: { uid: string }) {
      this.uid = options.uid;
    }
  },
  FlowModelRenderer: ({ model }: { model: { render: () => React.ReactNode } }) => model.render(),
  observer: (component: React.ComponentType) => component,
}));

vi.mock('../../../models/topbar/TopbarActionModel', async () => {
  const { FlowModel } = await import('@nocobase/flow-engine');
  return {
    TopbarActionModel: class extends FlowModel {
      isHidden() {
        return false;
      }

      getActionId() {
        return 'user-center';
      }

      renderWrapper(node: React.ReactNode) {
        return node;
      }

      renderButton() {
        return <button data-testid="user-center-button">User center</button>;
      }
    },
  };
});

vi.mock('../../../../acl/useAclSnippets', () => ({
  useAclSnippets: () => ({ allow: () => true }),
}));

vi.mock('../HelpLite', () => ({ HelpLite: () => null }));

import {
  UserCenterActionItemModel,
  UserCenterSelectItemModel,
  UserCenterTopbarActionModel,
} from '../../../models/topbar/UserCenterTopbarActionModel';
import { TopbarActionsBar } from '../TopbarActionsBar';

afterEach(cleanup);

function createUserCenter(onClick: () => Promise<void>, closeOnClick = true) {
  const item = new UserCenterActionItemModel({ uid: 'test-edit-profile', use: 'UserCenterActionItemModel' });
  item.label = 'Edit profile';
  item.onClick = onClick;
  item.closeOnClick = closeOnClick;
  const model = new UserCenterTopbarActionModel({ uid: 'test-user-center', use: 'UserCenterTopbarActionModel' });
  vi.spyOn(model, 'getPreparedItems').mockImplementation(async (closeDropdown) => {
    item.setCloseDropdown(closeDropdown);
    return [item];
  });
  return model;
}

async function openUserMenu(isMobile: boolean) {
  if (isMobile) {
    fireEvent.click(screen.getByRole('img', { name: 'ellipsis' }));
  }
  fireEvent.mouseEnter(screen.getByTestId('user-center-button'));
  const action = await screen.findByRole('button', { name: 'Edit profile' });
  await waitFor(() => expect(action).toBeVisible());
  return action;
}

describe('mobile user center popover', () => {
  it('closes both menus after selecting an action and keeps the opened drawer mounted', async () => {
    const model = createUserCenter(vi.fn());
    const Test = () => {
      const [open, setOpen] = useState(false);
      model.getPreparedItems = async (closeDropdown) => {
        const item = new UserCenterActionItemModel({ uid: 'profile', use: 'UserCenterActionItemModel' });
        item.label = 'Edit profile';
        item.onClick = async () => setOpen(true);
        item.setCloseDropdown(closeDropdown);
        return [item];
      };
      return (
        <>
          <TopbarActionsBar actions={[model]} isMobile />
          <Drawer open={open} title="Edit profile">
            <Input aria-label="Nickname" />
          </Drawer>
        </>
      );
    };
    render(<Test />);

    fireEvent.click(await openUserMenu(true));

    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: 'Nickname' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('img', { name: 'ellipsis' }));
    fireEvent.mouseEnter(screen.getByTestId('user-center-button'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit profile' })).toBeVisible());
  });

  it('respects actions that keep the menu open', async () => {
    const onClick = vi.fn(async () => {});
    render(<TopbarActionsBar actions={[createUserCenter(onClick, false)]} isMobile />);

    fireEvent.click(await openUserMenu(true));

    await waitFor(() => expect(onClick).toHaveBeenCalledOnce());
    expect(screen.getByRole('tooltip')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit profile' })).toBeVisible();
  });

  it('keeps the topbar open when the user only leaves the nested menu', async () => {
    render(<TopbarActionsBar actions={[createUserCenter(vi.fn())]} isMobile />);
    const action = await openUserMenu(true);

    const dropdown = action.closest('.ant-dropdown');
    expect(dropdown).not.toBeNull();
    if (dropdown) {
      fireEvent.mouseLeave(dropdown);
    }
    fireEvent.mouseLeave(screen.getByTestId('user-center-button'));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeInTheDocument());
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('keeps desktop actions working without a mobile popover', async () => {
    const onClick = vi.fn(async () => {});
    render(<TopbarActionsBar actions={[createUserCenter(onClick)]} />);

    fireEvent.click(await openUserMenu(false));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeInTheDocument());
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('img', { name: 'ellipsis' })).not.toBeInTheDocument();
  });

  it('shows profile while checking availability and ignores a result from an earlier opening', async () => {
    let resolveFirst!: (visible: boolean) => void;
    const firstCheck = new Promise<boolean>((resolve) => {
      resolveFirst = resolve;
    });
    const check = vi.fn().mockReturnValueOnce(firstCheck).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    class Profile extends UserCenterActionItemModel {
      static itemId = 'profile';
      label = 'Edit profile';
    }
    class Verification extends UserCenterActionItemModel {
      static itemId = 'verification';
      label = 'Verification';
      checkAvailability = check;
    }

    const model = new UserCenterTopbarActionModel({ uid: 'menu', use: 'UserCenterTopbarActionModel' });
    Object.defineProperty(model, 'flowEngine', {
      value: {
        getSubclassesOfAsync: () =>
          new Map<string, typeof UserCenterActionItemModel>([
            ['profile', Profile],
            ['verification', Verification],
          ]),
        createModel: ({ use, uid }: { use: typeof UserCenterActionItemModel; uid: string }) =>
          new use({ uid, use: use.name }),
      },
    });
    render(<TopbarActionsBar actions={[model]} />);

    const closeMenu = async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeInTheDocument());
    };

    await openUserMenu(false);
    expect(check).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Verification' })).not.toBeInTheDocument();
    await closeMenu();

    await openUserMenu(false);
    expect(check).toHaveBeenCalledTimes(2);
    await act(async () => resolveFirst(true));
    expect(screen.queryByRole('button', { name: 'Verification' })).not.toBeInTheDocument();
    await closeMenu();

    await openUserMenu(false);
    expect(await screen.findByRole('button', { name: 'Verification' })).toBeVisible();
  });

  it.each([true, false])('respects closeOnChange=%s for preference selectors', async (closeOnChange) => {
    const onChange = vi.fn(async () => {});
    const item = new UserCenterSelectItemModel({ uid: 'language', use: 'UserCenterSelectItemModel' });
    item.label = 'Language';
    item.value = 'en';
    item.options = [
      { label: 'English', value: 'en' },
      { label: 'Chinese', value: 'zh' },
    ];
    item.onChange = onChange;
    item.closeOnChange = closeOnChange;
    const model = createUserCenter(vi.fn());
    model.getPreparedItems = async (closeDropdown) => {
      item.setCloseDropdown(closeDropdown);
      return [item];
    };
    render(<TopbarActionsBar actions={[model]} isMobile />);
    fireEvent.click(screen.getByRole('img', { name: 'ellipsis' }));
    fireEvent.mouseEnter(screen.getByTestId('user-center-button'));
    const select = await screen.findByRole('combobox');
    await waitFor(() => expect(select.closest('.ant-select')).toBeVisible());

    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByText('Chinese'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('zh'));
    if (closeOnChange) {
      await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    } else {
      expect(screen.getByRole('tooltip')).toBeVisible();
      expect(select.closest('.ant-select')).toBeVisible();
    }
  });

  it('does not reopen the previous popover after switching to desktop and back', async () => {
    const actions = [createUserCenter(vi.fn())];
    const { rerender } = render(<TopbarActionsBar actions={actions} isMobile />);
    fireEvent.click(screen.getByRole('img', { name: 'ellipsis' }));
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());

    rerender(<TopbarActionsBar actions={actions} isMobile={false} />);
    rerender(<TopbarActionsBar actions={actions} isMobile />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
