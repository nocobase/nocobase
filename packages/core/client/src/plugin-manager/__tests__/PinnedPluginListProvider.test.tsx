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
import { describe, expect, it } from 'vitest';
import { ACLContext } from '../../acl/ACLProvider';
import { Application } from '../../application/Application';
import { ApplicationContext } from '../../application/context';
import { SchemaComponentOptions } from '../../schema-component';
import { getPinnedPluginListKeys, PinnedPluginListContext } from '../context';
import { PinnedPluginList, PinnedPluginListProvider } from '../PinnedPluginListProvider';

describe('PinnedPluginListProvider', () => {
  it('should keep unordered items in place while sorting ordered slots', () => {
    expect(
      getPinnedPluginListKeys({
        foo: { component: 'Foo', order: 301, pin: true, snippet: '*' },
        bar: { component: 'Bar', pin: true, snippet: '*' },
        baz: { component: 'Baz', order: 300, pin: true, snippet: '*' },
      }),
    ).toEqual(['foo', 'bar', 'baz']);
  });

  it('should merge legacy items into pinned plugin list context', async () => {
    render(
      <PinnedPluginListProvider
        items={{
          foo: { component: 'Foo', order: 300, pin: true, snippet: '*' },
        }}
      >
        <PinnedPluginListContext.Consumer>
          {(value) => <div>{JSON.stringify(value.items)}</div>}
        </PinnedPluginListContext.Consumer>
      </PinnedPluginListProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('{"foo":{"component":"Foo","order":300,"pin":true,"snippet":"*"}}')).toBeInTheDocument();
    });
  });

  it('should render actions from merged context as the final data source', async () => {
    const app = new Application({ disableAcl: true });
    const Foo = () => <div>Foo action</div>;

    render(
      <ApplicationContext.Provider value={app}>
        <ACLContext.Provider value={{ data: { data: { allowAll: true, snippets: ['*'] }, meta: {} } }}>
          <SchemaComponentOptions components={{ Foo }}>
            <PinnedPluginListProvider
              items={{
                foo: { component: 'Foo', order: 300, pin: true, snippet: '*' },
              }}
            >
              <PinnedPluginList />
            </PinnedPluginListProvider>
          </SchemaComponentOptions>
        </ACLContext.Provider>
      </ApplicationContext.Provider>,
    );

    expect(await screen.findByText('Foo action')).toBeInTheDocument();
  });

  it('should keep inner provider override semantics and fallback after inner unmount', async () => {
    const app = new Application({ disableAcl: true });
    const OuterAction = () => <div>Outer action</div>;
    const InnerAction = () => <div>Inner action</div>;

    const Test = (props: { showInner: boolean }) => {
      return (
        <ApplicationContext.Provider value={app}>
          <ACLContext.Provider value={{ data: { data: { allowAll: true, snippets: ['*'] }, meta: {} } }}>
            <PinnedPluginListProvider
              items={{
                foo: { component: 'OuterAction', order: 300, pin: true, snippet: '*' },
              }}
            >
              <SchemaComponentOptions components={{ OuterAction }}>
                {props.showInner ? (
                  <PinnedPluginListProvider
                    items={{
                      foo: { component: 'InnerAction', order: 300, pin: true, snippet: '*' },
                    }}
                  >
                    <SchemaComponentOptions components={{ InnerAction }}>
                      <PinnedPluginList />
                    </SchemaComponentOptions>
                  </PinnedPluginListProvider>
                ) : (
                  <PinnedPluginList />
                )}
              </SchemaComponentOptions>
            </PinnedPluginListProvider>
          </ACLContext.Provider>
        </ApplicationContext.Provider>
      );
    };

    const { rerender } = render(<Test showInner={true} />);

    expect(await screen.findByText('Inner action')).toBeInTheDocument();
    expect(screen.queryByText('Outer action')).not.toBeInTheDocument();

    rerender(<Test showInner={false} />);

    await waitFor(() => {
      expect(screen.getByText('Outer action')).toBeInTheDocument();
    });
    expect(screen.queryByText('Inner action')).not.toBeInTheDocument();
  });
});
