import { renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListRecoveryError } from '../../client/hooks/use-table-url-state.js';
import { SettingsError } from '../../client/pages/settings/shared.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/settings-feedback-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
describe.each([
  ['en-US', enUS],
  ['zh-CN', zhCN],
] as const)('%s', (language, copy) => {
  it('guides correction of invalid input without replaying it or exposing raw errors', async () => {
    const retry = vi.fn();
    await renderWithApp(
      <SettingsError
        error={{ status: 400, message: 'secret database details' }}
        retry={retry}
      />,
      {
        locale: language,
        namespace,
        namespaces,
      },
    );
    expect(screen.getByText(copy.settings.invalidRequest)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: copy.settings.retry }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('secret database details'),
    ).not.toBeInTheDocument();
    expect(retry).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'preserves bounded recovery feedback with inline=%s',
    async (inline) => {
      const retry = vi.fn();
      const message = 'The list changed repeatedly. Refresh to try again.';
      await renderWithApp(
        <SettingsError
          error={new ListRecoveryError(message)}
          retry={retry}
          inline={inline}
        />,
        { locale: language, namespace, namespaces },
      );
      expect(screen.getByText(message)).toBeVisible();
      expect(screen.queryByText(copy.settings.failed)).not.toBeInTheDocument();
      expect(screen.queryAllByRole('alert')).toHaveLength(inline ? 0 : 1);
      expect(retry).not.toHaveBeenCalled();
      await userEvent.click(
        screen.getByRole('button', { name: copy.settings.retry }),
      );
      expect(retry).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps a retry for temporary failures and performs it only on demand', async () => {
    const retry = vi.fn();
    await renderWithApp(
      <SettingsError error={{ status: 503 }} retry={retry} />,
      {
        locale: language,
        namespace,
        namespaces,
      },
    );
    expect(screen.getByText(copy.settings.failed)).toBeVisible();
    expect(retry).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: copy.settings.retry }),
    );
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('does not describe every conflict as a role edit or offer a blind retry', async () => {
    await renderWithApp(
      <SettingsError error={{ status: 409 }} retry={vi.fn()} />,
      {
        locale: language,
        namespace,
        namespaces,
      },
    );
    expect(screen.getByText(copy.settings.conflict)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: copy.settings.retry }),
    ).not.toBeInTheDocument();
  });
});
