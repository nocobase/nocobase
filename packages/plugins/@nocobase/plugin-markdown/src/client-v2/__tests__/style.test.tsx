/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useStyle from '../components/style';

const useStyleRegister = vi.fn((_config, styleFactory: () => Record<string, unknown>) => {
  const styles = styleFactory();
  return (node: React.ReactNode) => (
    <div data-testid="style-wrapper" data-selectors={Object.keys(styles).join(',')}>
      {node}
    </div>
  );
});

vi.mock('@ant-design/cssinjs', () => ({
  useStyleRegister: (...args: Parameters<typeof useStyleRegister>) => useStyleRegister(...args),
}));

vi.mock('antd', () => ({
  theme: {
    useToken: () => ({
      theme: 'antd-theme',
      token: {
        fontSize: 14,
        colorBgContainer: '#fff',
      },
      hashId: 'hash-id',
    }),
  },
}));

function StyleReader() {
  const { wrapSSR, componentCls, hashId } = useStyle();
  return wrapSSR(
    <span data-testid="style-result" data-component-cls={componentCls} data-hash-id={hashId}>
      content
    </span>,
  );
}

describe('useStyle', () => {
  it('registers markdown vditor styles and returns stable class metadata', () => {
    render(<StyleReader />);

    expect(screen.getByTestId('style-wrapper')).toHaveAttribute('data-selectors', '.nb-markdown-vditor');
    expect(screen.getByTestId('style-result')).toHaveAttribute('data-component-cls', 'nb-markdown-vditor');
    expect(screen.getByTestId('style-result')).toHaveAttribute('data-hash-id', 'hash-id');
    expect(useStyleRegister).toHaveBeenCalledWith(
      {
        theme: 'antd-theme',
        token: {
          fontSize: 14,
          colorBgContainer: '#fff',
        },
        hashId: 'hash-id',
        path: ['plugin-markdown', 'nb-markdown-vditor'],
      },
      expect.any(Function),
    );
  });
});
