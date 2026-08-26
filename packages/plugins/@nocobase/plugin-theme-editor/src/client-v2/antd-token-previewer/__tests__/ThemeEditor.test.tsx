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
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThemeEditor from '../ThemeEditor';

const mocks = vi.hoisted(() => ({
  tokenPanelProps: [] as any[],
  updateRef: vi.fn(),
  onInfoFollowPrimaryChange: vi.fn(),
}));

vi.mock('../component-panel', () => ({
  antdComponents: {},
}));

vi.mock('../hooks/useControlledTheme', () => ({
  default: ({ theme: customTheme }: any) => ({
    theme: {
      config: customTheme?.config ?? {},
    },
    infoFollowPrimary: false,
    onInfoFollowPrimaryChange: mocks.onInfoFollowPrimaryChange,
    updateRef: mocks.updateRef,
  }),
}));

vi.mock('../token-panel-pro', () => ({
  default: (props: any) => {
    mocks.tokenPanelProps.push(props);

    return <div data-testid="token-panel" style={props.style} />;
  },
}));

vi.mock('../token-panel-pro/ComponentDemoPro', () => ({
  default: () => <div data-testid="component-demo" />,
}));

describe('ThemeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tokenPanelProps.length = 0;
  });

  it('uses a shrinkable editor layout when embedded', () => {
    const { container } = render(
      <ThemeEditor embedded theme={{ name: 'Custom theme', key: 'custom', config: { token: {} } }} />,
    );

    const editor = container.querySelector('.antd-theme-editor');
    const tokenPane = editor?.firstElementChild as HTMLElement | undefined;

    expect(tokenPane?.style.flex).toBe('1 1 0px');
    expect(tokenPane?.style.minWidth).toBe('0');
    expect(screen.queryByTestId('component-demo')).toBeNull();
    expect(mocks.tokenPanelProps.at(-1)?.embedded).toBe(true);
    expect(mocks.tokenPanelProps.at(-1)?.style?.minWidth).toBe(0);
  });

  it('keeps the component preview in the default layout', () => {
    render(<ThemeEditor theme={{ name: 'Custom theme', key: 'custom', config: { token: {} } }} />);

    expect(screen.getByTestId('component-demo')).toBeTruthy();
    expect(mocks.tokenPanelProps.at(-1)?.embedded).toBeUndefined();
  });
});
