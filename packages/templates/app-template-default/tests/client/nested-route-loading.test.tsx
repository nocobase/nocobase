import { apiClientToken } from '@nocobase/app-client';
import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { renderWithApp } from '@nocobase/app-testing/client';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Activity, useState } from 'react';
import { Link, Outlet, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { RouteDialog } from '../../client/components/route-dialog.js';
import { renderRouteTree } from '../../client/routing/route-tree.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const options = {
  namespace: packageMetadata.name,
  namespaces: { [packageMetadata.name]: enUS },
  services(app: import('@nocobase/app-client').ClientApplication) {
    app.container.singleton(
      authorizationClientToken,
      (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
    );
  },
};

function deferredModule() {
  let resolve!: (module: AppClientRouteComponentModule) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<AppClientRouteComponentModule>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function page(
  name: string,
  path: string,
  loader?: AppClientRegisteredRoute['componentLoader'],
  children?: AppClientRegisteredRoute[],
): AppClientRegisteredRoute {
  return {
    id: name,
    name,
    path,
    auth: 'required',
    authz: 'skip',
    packageName: packageMetadata.name,
    source: 'application',
    componentLoader: loader,
    children,
  };
}

function ParentPage() {
  const [draft, setDraft] = useState('');
  return (
    <section aria-label='Parent page'>
      <input
        aria-label='Draft'
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Link to='/parent/child'>Open child</Link>
      <Link to='/parent'>Cancel child</Link>
      <Outlet />
    </section>
  );
}

const childModule = {
  default: () => (
    <RouteDialog title='Child dialog'>
      <p>Child content</p>
    </RouteDialog>
  ),
};
const parentModule = { default: ParentPage };
const timeout = { timeout: 10_000 };

describe('nested route loading', () => {
  it('detaches a pending portal while its parent Activity is hidden', async () => {
    const pending = deferredModule();
    const tree = (
      <Routes>
        {renderRouteTree([
          page('parent', '/parent', async () => parentModule, [
            page('child', '/parent/child', () => pending.promise),
          ]),
        ])}
      </Routes>
    );
    const view = await renderWithApp(
      <Activity mode='visible'>{tree}</Activity>,
      { ...options, route: '/parent/child' },
    );
    await screen.findByRole('textbox', { name: 'Draft' }, timeout);
    const loading = screen.getByRole('status', { name: 'Loading page' });
    view.rerender(<Activity mode='hidden'>{tree}</Activity>);
    expect(loading).not.toBeInTheDocument();
    view.rerender(<Activity mode='visible'>{tree}</Activity>);
    expect(
      await screen.findByRole('status', { name: 'Loading page' }, timeout),
    ).toBe(loading);
    await act(async () => pending.resolve(childModule));
    expect(
      await screen.findByRole('dialog', { name: 'Child dialog' }, timeout),
    ).toBeVisible();
  });

  it('keeps root page loading in flow through navigation-only groups', async () => {
    const pending = deferredModule();
    const view = await renderWithApp(
      <Routes>
        {renderRouteTree([
          page('group', '/parent', undefined, [
            page('root', '/parent/child', () => pending.promise),
          ]),
        ])}
      </Routes>,
      { ...options, route: '/parent/child' },
    );
    const loading = screen.getByRole('status', { name: 'Loading page' });
    expect(view.container).toContainElement(loading);
    expect(loading).toHaveClass('min-h-[calc(100svh-4rem)]');
    await act(async () =>
      pending.resolve({ default: () => <p>Root content</p> }),
    );
    expect(await screen.findByText('Root content', {}, timeout)).toBeVisible();
    expect(loading).not.toBeInTheDocument();
  });

  it('loads a child outside its parent layout and preserves the parent draft', async () => {
    const pending = deferredModule();
    await renderWithApp(
      <Routes>
        {renderRouteTree([
          page('parent', '/parent', async () => parentModule, [
            page('group', '/parent', undefined, [
              page('child', '/parent/child', () => pending.promise),
            ]),
          ]),
        ])}
      </Routes>,
      { ...options, route: '/parent' },
    );
    const input = await screen.findByRole(
      'textbox',
      { name: 'Draft' },
      timeout,
    );
    fireEvent.change(input, { target: { value: 'Unsaved draft' } });
    fireEvent.click(screen.getByRole('link', { name: 'Open child' }));
    const loading = await screen.findByRole(
      'status',
      { name: 'Loading page' },
      timeout,
    );
    expect(
      within(screen.getByRole('region', { name: 'Parent page' })).queryByRole(
        'status',
      ),
    ).toBeNull();
    expect(loading).not.toHaveClass('min-h-[calc(100svh-4rem)]');
    expect(loading.parentElement).toHaveClass('fixed', 'pointer-events-none');
    await act(async () => pending.resolve(childModule));
    expect(
      await screen.findByRole('dialog', { name: 'Child dialog' }, timeout),
    ).toBeVisible();
    expect(loading).not.toBeInTheDocument();
    expect(input).toHaveValue('Unsaved draft');
  });

  it('removes a pending portal on navigation and ignores its late result', async () => {
    const pending = deferredModule();
    await renderWithApp(
      <Routes>
        {renderRouteTree([
          page('parent', '/parent', async () => parentModule, [
            page('child', '/parent/child', () => pending.promise),
          ]),
        ])}
      </Routes>,
      { ...options, route: '/parent/child' },
    );
    await screen.findByRole('textbox', { name: 'Draft' }, timeout);
    const loading = screen.getByRole('status', { name: 'Loading page' });
    fireEvent.click(screen.getByRole('link', { name: 'Cancel child' }));
    await waitFor(() => expect(loading).not.toBeInTheDocument());
    await act(async () => pending.resolve(childModule));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('removes the floating wait when a child module fails', async () => {
    const pending = deferredModule();
    await renderWithApp(
      <Routes>
        {renderRouteTree([
          page('parent', '/parent', async () => parentModule, [
            page('child', '/parent/child', () => pending.promise),
          ]),
        ])}
      </Routes>,
      { ...options, route: '/parent/child' },
    );
    await screen.findByRole('textbox', { name: 'Draft' }, timeout);
    const loading = screen.getByRole('status', { name: 'Loading page' });
    await act(async () => pending.reject(new Error('Unavailable')));
    expect(
      await screen.findByText('Unable to load page', {}, timeout),
    ).toBeVisible();
    expect(loading).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});
