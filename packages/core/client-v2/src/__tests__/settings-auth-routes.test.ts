/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '../index';
import { SettingsApplication } from '../settings-app/SettingsApplication';

describe('standalone settings authentication routes', () => {
  it('keeps and rebases the auth and 2fa route families', () => {
    const app = new SettingsApplication({ router: { type: 'memory' }, ws: false });

    app.router.add('auth', { Component: () => null });
    app.router.add('auth.signin', { path: '/signin', skipAuthCheck: true, Component: () => null });
    app.router.add('auth.signup', { path: '/signup', skipAuthCheck: true, Component: () => null });
    app.router.add('auth.forgotPassword', {
      path: '/forgot-password',
      skipAuthCheck: true,
      Component: () => null,
    });
    app.router.add('auth.resetPassword', {
      path: '/reset-password',
      skipAuthCheck: true,
      Component: () => null,
    });
    app.router.add('2fa', { Component: () => null });
    app.router.add('2fa.verify', { path: '/2fa', skipAuthCheck: true, Component: () => null });

    expect(app.router.get('auth.signin')).toMatchObject({ path: '/settings/signin', skipAuthCheck: true });
    expect(app.router.get('auth.signup')).toMatchObject({ path: '/settings/signup', skipAuthCheck: true });
    expect(app.router.get('auth.forgotPassword')).toMatchObject({
      path: '/settings/forgot-password',
      skipAuthCheck: true,
    });
    expect(app.router.get('auth.resetPassword')).toMatchObject({
      path: '/settings/reset-password',
      skipAuthCheck: true,
    });
    expect(app.router.get('2fa.verify')).toMatchObject({ path: '/settings/2fa', skipAuthCheck: true });
    expect(app.router.matchRoutes('/settings/signin')?.map((match) => match.route.id)).toContain('auth.signin');
    expect(app.router.isSkippedAuthCheckRoute('/settings/reset-password')).toBe(true);
  });

  it('does not change the default Client V2 authentication routes', () => {
    const app = new Application({ router: { type: 'memory' }, ws: false });

    app.router.add('auth', { Component: () => null });
    app.router.add('auth.signin', { path: '/signin', skipAuthCheck: true, Component: () => null });
    app.router.add('2fa', { Component: () => null });
    app.router.add('2fa.verify', { path: '/2fa', skipAuthCheck: true, Component: () => null });

    expect(app.router.get('auth.signin')).toMatchObject({ path: '/signin', skipAuthCheck: true });
    expect(app.router.get('2fa.verify')).toMatchObject({ path: '/2fa', skipAuthCheck: true });
  });

  it('continues to reject unrelated routes from the shared plugin lane', () => {
    const app = new SettingsApplication({ router: { type: 'memory' }, ws: false });

    app.router.add('admin.demo', { path: '/admin/demo' });
    app.router.add('public.demo', { path: '/public/demo' });
    app.router.add('mobile.demo', { path: '/mobile/demo' });

    expect(app.router.has('admin.demo')).toBe(false);
    expect(app.router.has('public.demo')).toBe(false);
    expect(app.router.has('mobile.demo')).toBe(false);
  });
});
