import type { KeyScopeOptions } from '@nocobase/app-plugin-api-keys/shared/scopes';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import appLocales from '../../client/locales/index.js';
import type { KeyDraft } from '../../client/components/api-keys/key-scope-model';
import releasesLocales from '../../../../plugins/app-plugin-releases/client/locales/index.js';

const options: KeyScopeOptions = {
  groups: [],
  presets: [
    {
      id: 'ci-deploy',
      title: 'CI deploy',
      description: {
        key: 'access.keyScopes.presets.ciDeploy.description',
        ns: '@nocobase/app-plugin-releases',
      },
      groups: {},
      expiresInDays: 90,
    },
    {
      id: 'ci-upload',
      title: 'CI upload',
      description: {
        key: 'access.keyScopes.presets.ciUpload.description',
        ns: '@nocobase/app-plugin-releases',
      },
      groups: {},
      expiresInDays: 90,
    },
  ],
  maxScopedKeyDays: null,
  defaultExpiresInDays: 90,
};

const draft: KeyDraft = {
  name: '',
  description: '',
  expiry: '90',
  mode: 'full',
  groups: {},
};

const { ScopeEditor } =
  await import('../../client/components/api-keys/scope-editor');

describe('API key scope preset descriptions', () => {
  it('shows real English and Chinese preset descriptions and updates them when the preset changes', async () => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'studio', resources: appLocales },
      namespaces: { '@nocobase/app-plugin-releases': releasesLocales },
    });
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <ScopeEditor
          options={options}
          draft={draft}
          objects={async () => []}
          onChange={onChange}
        />
      </TestI18nProvider>,
    );

    const presetSelect = screen.getByRole('combobox', {
      name: 'Start from a preset',
    });
    await user.click(presetSelect);
    await user.click(await screen.findByRole('option', { name: 'CI deploy' }));

    const englishDescription =
      'Upload releases to the chosen apps and deploy them, for 90 days. To configure repository CI, go to the project’s Deployment › Configure CI and generate a repository CI key.';
    const chineseDescription =
      '向选定的应用上传版本并部署，有效期 90 天。配置仓库 CI 请到项目的「部署 › 配置 CI」生成仓库 CI 密钥。';
    expect(screen.getByText(englishDescription)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();

    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByText(chineseDescription)).toBeInTheDocument();

    await user.click(presetSelect);
    await user.click(await screen.findByRole('option', { name: 'CI upload' }));
    expect(
      screen.getByText('向选定的应用上传版本但不部署，有效期 90 天。'),
    ).toBeInTheDocument();
    expect(screen.queryByText(chineseDescription)).not.toBeInTheDocument();
  });
});
