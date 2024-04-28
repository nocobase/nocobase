import { Context, Next } from '@nocobase/actions';
import { koaMulter as multer } from '@nocobase/utils';

export async function importMiddleware(ctx: Context, next: Next) {
  if (ctx.action.actionName !== 'importXlsx') {
    return next();
  }
  const upload = multer().single('file');
  return upload(ctx, next);
}
