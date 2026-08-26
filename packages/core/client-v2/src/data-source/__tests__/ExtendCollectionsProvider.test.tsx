/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions } from '@nocobase/flow-engine';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { act, render } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { createMockClient } from '../../MockApplication';
import { ExtendCollectionsProvider } from '../ExtendCollectionsProvider';

// `MockApplication` isn't exported as a named type, so infer from the factory.
type AppInstance = ReturnType<typeof createMockClient>;

function makeApp(): AppInstance {
  const app = createMockClient();
  // The mock client wires a lazy `appInfo` getter to `GET app:getInfo`; any
  // proxy iteration of the FlowEngineContext can trip it. Pre-stub so a 404
  // doesn't surface as an unhandled axios rejection during the test run.
  app.apiMock.onGet('app:getInfo').reply(200, { data: { version: 'test' } });
  return app;
}

const LOCKED: CollectionOptions = {
  name: 'lockedUsers',
  fields: [{ name: 'id', type: 'integer', interface: 'integer' }],
};

const USERS: CollectionOptions = {
  name: 'users',
  fields: [{ name: 'username', type: 'string', interface: 'input' }],
};

const POSTS: CollectionOptions = {
  name: 'posts',
  fields: [{ name: 'title', type: 'string', interface: 'input' }],
};

function mountWith(app: AppInstance, node: React.ReactNode) {
  return render(<FlowEngineProvider engine={app.flowEngine}>{node}</FlowEngineProvider>);
}

function getMain(app: AppInstance) {
  return app.dataSourceManager.getDataSource('main');
}

describe('ExtendCollectionsProvider', () => {
  // The defining contract: a page-inner that reads `getCollection(name)` in its
  // own render body (the LockedUsersPage pattern at LockedUsersPage.tsx:156-157)
  // must see the registered collection on its FIRST render, with no extra tick.
  it('lets children read the registered collection during their first render', () => {
    const app = makeApp();
    let firstRenderResult: { name?: string } | undefined;

    const Child: React.FC = () => {
      // Read synchronously during render — this is the contract that forces
      // the provider to register collections in render-phase rather than in
      // an effect.
      const found = getMain(app)?.getCollection?.(LOCKED.name);
      firstRenderResult = found ? { name: found.name } : undefined;
      return <div>child</div>;
    };

    mountWith(
      app,
      <ExtendCollectionsProvider collections={[LOCKED]}>
        <Child />
      </ExtendCollectionsProvider>,
    );

    expect(firstRenderResult).toEqual({ name: LOCKED.name });
  });

  it('removes only the collections it added when unmounted', () => {
    const app = makeApp();
    // Pre-existing collection in the data source — provider must not touch it.
    getMain(app).addCollection(USERS);

    const { unmount } = mountWith(
      app,
      <ExtendCollectionsProvider collections={[LOCKED]}>
        <span>inside</span>
      </ExtendCollectionsProvider>,
    );

    expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);
    expect(getMain(app).getCollection(USERS.name)?.name).toBe(USERS.name);

    unmount();

    expect(getMain(app).getCollection(LOCKED.name)).toBeUndefined();
    // The provider didn't add USERS, so it must leave it alone.
    expect(getMain(app).getCollection(USERS.name)?.name).toBe(USERS.name);
  });

  // Direct regression for the lazy-ref idempotency: even when the provider
  // re-renders many times (which is what StrictMode dev's double-render and
  // any caller-driven re-render look like to the provider), it must not
  // re-register the same collection or accumulate duplicate ownership.
  it('only calls addCollection once across many re-renders of the same mount', () => {
    const app = makeApp();
    let addCount = 0;
    const origAdd = getMain(app).addCollection.bind(getMain(app));
    getMain(app).addCollection = (c: CollectionOptions) => {
      addCount += 1;
      origAdd(c);
    };

    const Host: React.FC = () => {
      const [, setTick] = useState(0);
      // Force a render burst on mount — covers StrictMode dev's second render
      // and any other parent-driven re-renders. The lazy-ref guard in the
      // provider must hold across all of them.
      React.useEffect(() => {
        setTick((n) => n + 1);
        setTick((n) => n + 1);
      }, []);
      return (
        <ExtendCollectionsProvider collections={[LOCKED]}>
          <span>inside</span>
        </ExtendCollectionsProvider>
      );
    };

    const { unmount } = mountWith(app, <Host />);

    expect(addCount).toBe(1);
    expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);

    unmount();
    expect(getMain(app).getCollection(LOCKED.name)).toBeUndefined();
  });

  // Default semantics: "static-at-mount". Caller's prop changes are ignored.
  describe('with syncOnChange={false} (default)', () => {
    it('ignores a `collections` prop reference change after mount', () => {
      const app = makeApp();

      const Host: React.FC = () => {
        const [list, setList] = useState<CollectionOptions[]>([LOCKED]);
        return (
          <>
            <button type="button" onClick={() => setList([LOCKED, POSTS])}>
              add posts
            </button>
            <ExtendCollectionsProvider collections={list}>
              <span>inside</span>
            </ExtendCollectionsProvider>
          </>
        );
      };

      const { getByText } = mountWith(app, <Host />);
      expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);
      expect(getMain(app).getCollection(POSTS.name)).toBeUndefined();

      act(() => {
        getByText('add posts').click();
      });

      // POSTS must NOT have been registered — syncOnChange is off.
      expect(getMain(app).getCollection(POSTS.name)).toBeUndefined();
      expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);
    });
  });

  describe('with syncOnChange={true}', () => {
    it('adds collections newly added to the prop and removes ones dropped from it', () => {
      const app = makeApp();

      const Host: React.FC = () => {
        const [list, setList] = useState<CollectionOptions[]>([LOCKED, POSTS]);
        return (
          <>
            <button type="button" onClick={() => setList([POSTS, USERS])}>
              swap
            </button>
            <ExtendCollectionsProvider collections={list} syncOnChange>
              <span>inside</span>
            </ExtendCollectionsProvider>
          </>
        );
      };

      const { getByText } = mountWith(app, <Host />);
      expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);
      expect(getMain(app).getCollection(POSTS.name)?.name).toBe(POSTS.name);
      expect(getMain(app).getCollection(USERS.name)).toBeUndefined();

      act(() => {
        getByText('swap').click();
      });

      // LOCKED was dropped from the prop → removed.
      expect(getMain(app).getCollection(LOCKED.name)).toBeUndefined();
      // POSTS was in both lists → kept.
      expect(getMain(app).getCollection(POSTS.name)?.name).toBe(POSTS.name);
      // USERS is new → added.
      expect(getMain(app).getCollection(USERS.name)?.name).toBe(USERS.name);
    });

    it('still leaves pre-existing collections it never owned alone after diff', () => {
      const app = makeApp();
      // Pre-existing in the data source before the provider mounts.
      getMain(app).addCollection(USERS);

      const Host: React.FC = () => {
        const [list, setList] = useState<CollectionOptions[]>([LOCKED, USERS]);
        return (
          <>
            <button type="button" onClick={() => setList([LOCKED])}>
              drop users
            </button>
            <ExtendCollectionsProvider collections={list} syncOnChange>
              <span>inside</span>
            </ExtendCollectionsProvider>
          </>
        );
      };

      const { getByText } = mountWith(app, <Host />);
      // USERS was already there, so the provider never owned it.
      expect(getMain(app).getCollection(USERS.name)?.name).toBe(USERS.name);

      act(() => {
        getByText('drop users').click();
      });

      // The prop dropped USERS, but the provider doesn't own it — must not
      // accidentally remove it.
      expect(getMain(app).getCollection(USERS.name)?.name).toBe(USERS.name);
      expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);
    });
  });

  // Mid-session reload: the data source manager wipes everything and reloads
  // from the server; client-only entries this provider registered would be
  // gone. The `dataSource:loaded` event handler re-adds owned entries.
  it('re-registers owned collections after a dataSource:loaded event', () => {
    const app = makeApp();

    mountWith(
      app,
      <ExtendCollectionsProvider collections={[LOCKED]}>
        <span>inside</span>
      </ExtendCollectionsProvider>,
    );
    expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);

    // Simulate the data source manager wiping then re-broadcasting the event.
    act(() => {
      getMain(app).removeCollection(LOCKED.name);
      app.eventBus.dispatchEvent(new CustomEvent('dataSource:loaded', { detail: { dataSourceKey: 'main' } }));
    });

    expect(getMain(app).getCollection(LOCKED.name)?.name).toBe(LOCKED.name);
  });
});
