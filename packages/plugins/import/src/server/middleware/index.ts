import multer from '@koa/multer';
import { Context, Next } from '@nocobase/actions';

export async function importMiddleware(ctx: Context, next: Next) {
  const upload = multer().single('file');
  return upload(ctx, next);
}
