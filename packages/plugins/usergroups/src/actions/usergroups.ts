import { Context, Next } from '@nocobase/actions';
import { namespace } from '../';

export async function getTree(ctx: Context, next: Next) {
  await next();
}

export async function getSubUsers(ctx: Context, next: Next) {
  await next();
}

export async function getSubUserGroups(ctx: Context, next: Next) {
  await next();
}