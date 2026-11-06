import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import { StateBadge } from '../client/components/record-ui.js';
import locales from '../client/locales/index.js';

it('keeps requested, in-progress, failed and completed refunds distinct after a language switch', async () => {
  const namespace = '@nocobase/app-plugin-lifecycle-example';
  const runtime = await createTestI18nRuntime({
    namespaces: { [namespace]: locales },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <section aria-label='Refund in progress'>
        <StateBadge state='refunding' />
      </section>
      <section aria-label='Refund failed'>
        <StateBadge state='refundNeedsAttention' />
      </section>
      <section aria-label='Refund completed'>
        <StateBadge state='refunded' />
      </section>
    </TestI18nProvider>,
  );
  const stages = {
    'en-US': ['Refunding', 'Refunded', 'Refund requested by the customer.'],
    'zh-CN': ['退款中', '已退款', '客户已申请退款。'],
    'zh-TW': ['退款中', '已退款', '客戶已申請退款。'],
    'ja-JP': [
      '返金処理中',
      '返金されました',
      'お客様から返金の依頼がありました。',
    ],
    'es-ES': [
      'Reembolso en curso',
      'Reembolsado',
      'Reembolso solicitado por el cliente.',
    ],
    'pt-BR': [
      'Reembolso em andamento',
      'Reembolsado',
      'Reembolso solicitado pelo cliente.',
    ],
    'fr-FR': [
      'Remboursement en cours',
      'Remboursé',
      'Remboursement demandé par le client.',
    ],
    'de-DE': [
      'Rückerstattung läuft',
      'Erstattet',
      'Rückerstattung vom Kunden angefordert.',
    ],
    'vi-VN': [
      'Đang hoàn tiền',
      'Đã hoàn tiền',
      'Khách hàng đã yêu cầu hoàn tiền.',
    ],
    'id-ID': [
      'Sedang mengembalikan dana',
      'Dana telah dikembalikan',
      'Pengembalian dana diminta oleh pelanggan.',
    ],
  };
  for (const [language, [pending, completed, requested]] of Object.entries(
    stages,
  )) {
    await act(() => runtime.changeLanguage(language));
    const pendingRegion = screen.getByRole('region', {
      name: 'Refund in progress',
    });
    expect(pendingRegion).toHaveTextContent(pending!);
    expect(pendingRegion).not.toHaveTextContent(completed!);
    expect(
      screen.getByRole('region', { name: 'Refund completed' }),
    ).toHaveTextContent(completed!);
    const failed = screen.getByRole('region', { name: 'Refund failed' });
    expect(failed).not.toHaveTextContent(completed!);
    expect(
      within(failed).queryByText(pending!, { exact: true }),
    ).not.toBeInTheDocument();
    const t = runtime.getFixedT(namespace, language);
    expect(t('orders.banner.cancelled.refundRequested')).toBe(requested);
    expect(t('orders.banner.refunding')).not.toBe(t('orders.banner.refunded'));
  }
});

it('preserves the example currency and the quoted sample record identity', async () => {
  const namespace = '@nocobase/app-plugin-lifecycle-example';
  const runtime = await createTestI18nRuntime({
    namespaces: { [namespace]: locales },
  });
  await runtime.changeLanguage('ja-JP');
  const ja = runtime.getFixedT(namespace, 'ja-JP');
  expect(ja('expenses.editor.amount')).toContain('人民元');
  expect(ja('orders.form.amount')).toContain('人民元');
  expect(ja('guide.expenses.step3')).toContain('50,000 人民元');
  await runtime.changeLanguage('vi-VN');
  expect(
    runtime.getFixedT(namespace, 'vi-VN')('guide.expenses.purpose'),
  ).toContain('nhân dân tệ');
  await runtime.changeLanguage('zh-TW');
  expect(
    runtime.getFixedT(namespace, 'zh-TW')('guide.expenses.step3'),
  ).toContain('法兰克福展会参展');
});
