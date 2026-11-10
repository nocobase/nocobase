/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { format } from 'date-fns';
import { calendarLocales, resolveCalendarCulture } from '../../shared/calendarLocale';

describe('calendarLocale', () => {
  it.each(['es-ES', 'es', 'es-MX'])('renders weekday headings in %s', (locale) => {
    const monday = new Date(2026, 10, 9);
    expect(format(monday, 'EEEE', { locale: calendarLocales[resolveCalendarCulture(locale)] })).toBe('lunes');
  });
  it('falls back for unknown locales', () => {
    expect(resolveCalendarCulture('unknown')).toBe('en-US');
    expect(resolveCalendarCulture('zh-CN')).toBe('zh-CN');
  });
});
