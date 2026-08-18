/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppSwitcherActionPanelModel } from '../AppSwitcherActionPanelModel';

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Droppable: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FlowModelRenderer: ({ model }: { model: any }) => <>{model.renderButton()}</>,
  };
});

const createPanel = (actions: any[]) => {
  const model = Object.create(AppSwitcherActionPanelModel.prototype) as AppSwitcherActionPanelModel;
  Object.defineProperty(model, 'context', {
    configurable: true,
    value: {
      app: {
        entryActionManager: {
          getItems: () => [],
          revision: 0,
        },
      },
      flowSettingsEnabled: false,
      t: (key: string) => key,
      themeToken: {
        borderRadius: 6,
        colorBgTextHover: '#f5f5f5',
        colorText: '#111',
        fontSize: 14,
        lineHeight: 1.5,
        marginXS: 8,
        marginXXS: 4,
        opacityLoading: 0.45,
        paddingXS: 8,
      },
    },
  });
  model.mapSubModels = vi.fn((_key, callback) => actions.map(callback)) as AppSwitcherActionPanelModel['mapSubModels'];
  return model;
};

describe('AppSwitcherActionPanelModel', () => {
  it('wraps action icons with actionPanelBadge when provided by the action model', () => {
    const action = {
      uid: 'mail-entry',
      hidden: false,
      props: {
        icon: 'MailOutlined',
        title: 'Email',
      },
      actionPanelBadge: {
        count: 3,
        overflowCount: 99,
      },
      getTitle: () => 'Email',
      onClick: vi.fn(),
    };
    const model = createPanel([action]);

    render(model.renderContent() as React.ReactElement);

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
