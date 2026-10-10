/** @vitest-environment jsdom */

import { I18nProvider } from '@nocobase/i18n/client';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InputDialog } from '../../client/workflow-management/pages.js';
import clientLocales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';

const i18n = await createWorkflowI18nRuntime(clientLocales);

describe('workflow parameter dialog', () => {
  it('generates a switch for boolean parameters from the schema', () => {
    render(
      <I18nProvider runtime={i18n}>
        <InputDialog
          workflow={
            {
              id: 'workflow-1',
              hash: 'workflow-hash',
              parametersSchema: {
                enabled: { type: 'boolean', title: 'Enabled', default: true },
              },
              parameterValues: {},
            } as never
          }
          onClose={() => undefined}
        />
      </I18nProvider>,
    );

    const toggle = screen.getByRole('switch', { name: 'Enabled' });
    expect(toggle.getAttribute('data-checked')).toBe('');
  });
});
