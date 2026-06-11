/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TokenPanelPro from '..';

const mocks = vi.hoisted(() => ({
  aliasPanelProps: [] as any[],
}));

vi.mock('../TokenContent', () => ({
  default: () => <div data-testid="token-content" />,
}));

vi.mock('../AliasPanel', () => ({
  default: (props: any) => {
    mocks.aliasPanelProps.push(props);

    return <div data-testid="alias-panel" style={props.style} />;
  },
}));

describe('TokenPanelPro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.aliasPanelProps.length = 0;
  });

  it('keeps the collapsed alias trigger out of embedded panel layout', () => {
    const { container } = render(<TokenPanelPro embedded aliasOpen={false} theme={{ config: {} } as any} />);

    const panel = container.querySelector('.token-panel-pro') as HTMLElement | null;
    const tabs = container.querySelector('.token-panel-pro-tabs') as HTMLElement | null;
    const aliasStyle = mocks.aliasPanelProps.at(-1)?.style;

    expect(panel?.classList.contains('token-panel-pro-embedded')).toBe(true);
    expect(tabs?.style.flex).toBe('1 1 0px');
    expect(tabs?.style.minWidth).toBe('0');
    expect(aliasStyle).toMatchObject({
      position: 'absolute',
      right: 0,
      flex: 'none',
      width: 20,
      minWidth: 20,
      backgroundColor: 'transparent',
    });
  });

  it('uses bounded alias width when embedded panels are expanded', () => {
    render(<TokenPanelPro embedded aliasOpen theme={{ config: {} } as any} />);

    expect(mocks.aliasPanelProps.at(-1)?.style).toMatchObject({
      position: 'absolute',
      right: 0,
      flex: 'none',
      width: 'min(320px, 42%)',
      minWidth: 220,
      maxWidth: '42%',
      backgroundColor: '#F7F8FA',
    });
  });
});
