/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Application } from '../../application/Application';
import { ApplicationContext } from '../../application/context';
import { SchemaComponentOptions } from '../../schema-component';
import { HeaderActionRenderer, resolveLoadedHeaderActionComponent } from '../headerActions';

describe('headerActions', () => {
  it('should resolve componentLoader results with router-compatible semantics', () => {
    const DirectComponent = () => null;
    const DefaultComponent = () => null;
    const NamedComponent = () => null;

    expect(resolveLoadedHeaderActionComponent('Inbox')).toBe('Inbox');
    expect(resolveLoadedHeaderActionComponent(DirectComponent)).toBe(DirectComponent);
    expect(resolveLoadedHeaderActionComponent({ default: DefaultComponent })).toBe(DefaultComponent);
    expect(resolveLoadedHeaderActionComponent({ Component: NamedComponent })).toBe(NamedComponent);
    expect(resolveLoadedHeaderActionComponent({} as any)).toBeUndefined();
  });

  it('should render valid actions and skip invalid action without blocking others', async () => {
    const app = new Application({
      disableAcl: true,
      components: {
        GlobalAction: () => <div>Global action</div>,
      },
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ApplicationContext.Provider value={app}>
        <div>
          <HeaderActionRenderer item={{ name: 'global', componentLoader: async () => 'GlobalAction' }} />
          <HeaderActionRenderer item={{ name: 'invalid', componentLoader: async () => ({}) as any }} />
        </div>
      </ApplicationContext.Provider>,
    );

    expect(await screen.findByText('Global action')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('invalid')).not.toBeInTheDocument();
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should render memo schema component and skip invalid default export', async () => {
    const app = new Application({ disableAcl: true });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const MemoAction = React.memo(() => <div>Memo action</div>);

    render(
      <ApplicationContext.Provider value={app}>
        <SchemaComponentOptions components={{ MemoAction }}>
          <div>
            <HeaderActionRenderer item={{ name: 'memo', componentLoader: async () => 'MemoAction' }} />
            <HeaderActionRenderer
              item={{ name: 'invalid-default', componentLoader: async () => ({ default: {} as any }) }}
            />
          </div>
        </SchemaComponentOptions>
      </ApplicationContext.Provider>,
    );

    expect(await screen.findByText('Memo action')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('invalid-default')).not.toBeInTheDocument();
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
