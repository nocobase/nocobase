import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChoiceMenus } from '../../client/components/choice-menus.js';
import locales from '../../client/locales/index.js';

const namespace = '@nocobase/app-plugin-agent-sessions';

afterEach(cleanup);

describe('ChoiceMenus', () => {
  it.each(['model', 'thought_level', 'model_config', 'mode', 'custom'])(
    'closes the %s menu after selecting a value',
    async (category) => {
      const runtime = new I18nRuntime({
        defaultLocale: 'en-US',
        locales: ['en-US'],
        applicationNamespace: namespace,
      });
      runtime.registerApplicationNamespace(namespace, locales);
      await runtime.init('en-US');
      const onChoose = vi.fn();
      render(
        <I18nProvider runtime={runtime}>
          <ChoiceMenus
            choices={[
              {
                id: category,
                category,
                name: 'Setting',
                currentValue: 'first',
                options: [
                  { value: 'first', name: 'First' },
                  { value: 'second', name: 'Second' },
                ],
              },
            ]}
            onChoose={onChoose}
          />
        </I18nProvider>,
      );
      fireEvent.click(screen.getByRole('button'));
      if (category === 'custom') {
        fireEvent.click(await screen.findByRole('menuitem'));
      }
      fireEvent.click(
        await screen.findByRole('menuitemradio', { name: 'Second' }),
      );
      expect(onChoose).toHaveBeenCalledExactlyOnceWith(category, 'second');
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    },
  );
});
