/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { AppSupervisor } from '@nocobase/server';
import { LDAPAuth } from '../ldap-auth';

export const redirect = async (ctx: Context, next: Next) => {
  const { authenticator, __appName: appName } = ctx.action.params;
  const { RelayState: redirect } = ctx.action.params.values;
  let prefix = process.env.APP_PUBLIC_PATH || '';

  if (appName && appName !== 'main') {
    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode !== 'single') {
      prefix += `apps/${appName}`;
    }
  }

  const auth = (await ctx.app.authManager.get(authenticator, ctx)) as LDAPAuth;
  if (prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }

  try {
    const token = await auth.signIn();
    ctx.redirect(`${prefix}${redirect || '/admin'}?authenticator=${authenticator}&token=${token}`);
  } catch (error) {
    ctx.redirect(
      `${prefix}/signin?authenticator=${authenticator}&error=${error.message}&redirect=${redirect || '/admin'}`,
    );
  }

  await next();
};
