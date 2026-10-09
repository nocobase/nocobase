import { describe, expect, it } from 'vitest';

import {
  consumerOptions,
  emptyDataRequest,
  isDate,
  normalizeDataRequest,
  validateDataRequest,
  visibility,
  type DataRequestForm,
} from '../shared/data-request.js';

function form(values: Partial<DataRequestForm>): DataRequestForm {
  return {
    ...emptyDataRequest(),
    subject: '客户画像数据',
    reason: '季度分析',
    volume: 'x<50',
    scope: 'internal',
    consumers: ['内部合规风险审计'],
    frequency: 'once',
    deliveryDate: '2026-10-20',
    ...values,
  };
}

describe('data usage request form', () => {
  it('shows the delivery date for a one-time request and the period dates otherwise', () => {
    expect(visibility(form({})).deliveryDate).toBe(true);
    const monthly = visibility(form({ frequency: 'monthly' }));
    expect(monthly).toMatchObject({
      deliveryDate: false,
      periodDates: true,
      monthDay: true,
    });
  });

  it('offers consumer types by usage scope', () => {
    expect(consumerOptions('external')).toContain('第三方合作');
    expect(consumerOptions('internal')).toEqual([
      '内部合规风险审计',
      '内部管理及分析',
    ]);
  });

  it('requires the file shield answers for internal analysis', () => {
    const errors = validateDataRequest(form({ consumers: ['内部管理及分析'] }));
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        'fileShieldAccepted',
        'fileShieldScope',
        'fileShieldCopy',
        'fileShieldValidUntil',
      ]),
    );
  });

  it('requires a confidentiality agreement for a third party', () => {
    const errors = validateDataRequest(
      form({ scope: 'external', consumers: ['第三方合作'] }),
    );
    expect(errors.ndaFiles).toBeDefined();
  });

  it('requires the frequency detail that the frequency asks for', () => {
    expect(
      validateDataRequest(
        form({
          frequency: 'weekly',
          firstUseDate: '2026-10-01',
          lastDeliveryDate: '2026-12-31',
        }),
      ).weekDay,
    ).toBeDefined();
    expect(
      validateDataRequest(
        form({
          frequency: 'other',
          firstUseDate: '2026-10-01',
          lastDeliveryDate: '2026-12-31',
        }),
      ).frequencyNote,
    ).toBeDefined();
  });

  it('rejects a consumer type the scope does not offer', () => {
    expect(
      validateDataRequest(form({ scope: 'internal', consumers: ['客户'] }))
        .consumers,
    ).toBeDefined();
  });

  it('accepts a complete form and drops answers to hidden questions', () => {
    const complete = form({ monthDay: 5, fileShieldScope: 'leftover' });
    expect(validateDataRequest(complete)).toEqual({});
    expect(normalizeDataRequest(complete)).toMatchObject({
      monthDay: null,
      fileShieldScope: '',
    });
  });

  it('refuses a date that names no real day instead of moving it', () => {
    expect(isDate('2026-02-28')).toBe(true);
    expect(isDate('2028-02-29')).toBe(true);
    expect(isDate('2026-02-31')).toBe(false);
    expect(isDate('2026-13-01')).toBe(false);
    expect(validateDataRequest(form({ deliveryDate: '2026-02-31' }))).toEqual({
      deliveryDate: '请填写数据交付日期',
    });
  });
});
