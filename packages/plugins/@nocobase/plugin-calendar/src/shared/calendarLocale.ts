/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Locale } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import es from 'date-fns/locale/es';
import ru from 'date-fns/locale/ru';
import zhCN from 'date-fns/locale/zh-CN';

type Culture = 'en-US' | 'es' | 'ru-RU' | 'zh-CN';
export const calendarLocales: Record<Culture, Locale> = { 'en-US': enUS, es, 'ru-RU': ru, 'zh-CN': zhCN };

export function resolveCalendarCulture(locale?: string): Culture {
  const tag = locale?.replace(/_/g, '-').toLowerCase();
  const language = tag?.split('-')[0];
  const cultures = Object.keys(calendarLocales) as Culture[];
  return (
    cultures.find((key) => key.toLowerCase() === tag) ??
    cultures.find((key) => key.toLowerCase().split('-')[0] === language) ??
    'en-US'
  );
}
