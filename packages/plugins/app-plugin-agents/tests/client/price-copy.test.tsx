// @vitest-environment jsdom
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { PriceCells } from '../../client/pages/usage/prices/price-cells.js';
import locales from '../../client/locales/index.js';

it('names the configuration save action in every language and submits edited prices', async () => {
  const namespace = '@nocobase/app-plugin-agents';
  const runtime = await createTestI18nRuntime({
    namespaces: { [namespace]: locales },
  });
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <TestI18nProvider runtime={runtime} namespace={namespace}>
      <table>
        <tbody>
          <tr>
            <PriceCells
              model='Example'
              price={null}
              exact
              canEdit
              onSave={onSave}
            />
          </tr>
        </tbody>
      </table>
    </TestI18nProvider>,
  );
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0]!, { target: { value: '2' } });
  fireEvent.change(inputs[1]!, { target: { value: '3' } });
  // These names describe persistence, rather than a discount or reduction in price.
  const labels = {
    'en-US': 'Save the price of Example',
    'zh-CN': '保存 Example 的价格',
    'zh-TW': '儲存 Example 的價格',
    'ja-JP': 'Example の価格を保存',
    'es-ES': 'Guardar el precio de Example',
    'pt-BR': 'Salvar o preço de Example',
    'fr-FR': 'Enregistrer le prix de Example',
    'de-DE': 'Preis für Example speichern',
    'vi-VN': 'Lưu giá của Example',
    'id-ID': 'Simpan harga Example',
  };
  for (const [language, label] of Object.entries(labels)) {
    await act(() => runtime.changeLanguage(language));
    fireEvent.click(screen.getByRole('button', { name: label, exact: true }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledTimes(
        Object.keys(labels).indexOf(language) + 1,
      ),
    );
    expect(onSave).toHaveBeenLastCalledWith({ inputPerM: 2, outputPerM: 3 });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: label, exact: true }),
      ).not.toBeDisabled(),
    );
  }
});

it('keeps all model-family API routing information in the OpenCode help', async () => {
  const runtime = await createTestI18nRuntime({
    namespaces: { '@nocobase/app-plugin-agents': locales },
  });
  for (const language of Object.keys(locales)) {
    await runtime.changeLanguage(language);
    const message = runtime.getFixedT(
      '@nocobase/app-plugin-agents',
      language,
    )('services.connection.openCodeHint');
    for (const term of [
      'x-opencode-session',
      'DeepSeek',
      'GLM',
      'Kimi',
      'MiMo',
      'Claude',
      'MiniMax',
      'Qwen',
      'Anthropic',
      'GPT',
      'Grok',
      'OpenAI',
    ])
      expect(message).toContain(term);
  }
});
