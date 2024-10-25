/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Locale } from '../locale';

export async function i18n(ctx, next) {
  ctx.getCurrentLocale = () => {
    const lng =
      ctx.get('X-Locale') ||
      (ctx.request.query.locale as string) ||
      ctx.app.i18n.language ||
      ctx.acceptsLanguages().shift() ||
      'en-US';
    return lng;
  };

  const lng = ctx.getCurrentLocale();
  const localeManager = ctx.app.localeManager as Locale;
  const i18n = await localeManager.getI18nInstance(lng);
  ctx.i18n = i18n;
  ctx.t = i18n.t.bind(i18n);

  if (lng !== '*' && lng) {
    await i18n.changeLanguage(lng);
    await localeManager.loadResourcesByLang(lng);
  }

  await next();
}
