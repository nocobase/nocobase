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

import { ConversationImage } from '../../client/components/conversation-image.js';
import locales from '../../client/locales/index.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function setup(src: string, width = 800, height = 600) {
  const namespace = '@nocobase/app-plugin-agent-sessions';
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: namespace,
  });
  runtime.registerApplicationNamespace(namespace, locales);
  await runtime.init('en-US');
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
    height,
  );
  const submit = vi.fn();
  render(
    <I18nProvider runtime={runtime}>
      <form onSubmit={submit}>
        <ConversationImage src={src} />
      </form>
    </I18nProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open image preview' });
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('dialog', { name: 'Image preview' });
  return { trigger, submit };
}

describe('ConversationImage', () => {
  it.each([
    '/main/api/agentSessions/sessions/session/images/file',
    'data:image/png;base64,aW1hZ2U=',
  ])(
    'opens the original source %s, zooms, fits and closes without submitting',
    async (src) => {
      const { trigger, submit } = await setup(src);
      const image = screen.getByRole('img', {
        name: 'Image preview',
      }) as HTMLImageElement;
      expect(image.getAttribute('src')).toBe(src);
      Object.defineProperties(image, {
        naturalWidth: { value: 2400 },
        naturalHeight: { value: 1800 },
      });
      fireEvent.load(image);
      expect(image.style.width).toBe('800px');
      expect(image.style.height).toBe('600px');
      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
      expect(image.style.width).toBe('1200px');
      expect(image.style.height).toBe('900px');
      expect(
        screen
          .getByRole('button', { name: 'Zoom out' })
          .hasAttribute('disabled'),
      ).toBe(false);
      fireEvent.click(screen.getByRole('button', { name: 'Fit to screen' }));
      expect(
        screen
          .getByRole('button', { name: 'Zoom out' })
          .hasAttribute('disabled'),
      ).toBe(true);
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(submit).not.toHaveBeenCalled();
    },
  );
  it.each([
    {
      name: 'small image',
      width: 240,
      height: 120,
      viewportWidth: 800,
      viewportHeight: 600,
      expectedWidth: 240,
      expectedHeight: 120,
    },
    {
      name: 'narrow viewport',
      width: 2400,
      height: 1600,
      viewportWidth: 320,
      viewportHeight: 650,
      expectedWidth: 320,
      expectedHeight: 1600 / 7.5,
    },
  ])(
    'fits $name and restores focus after visible close',
    async ({
      width,
      height,
      viewportWidth,
      viewportHeight,
      expectedWidth,
      expectedHeight,
    }) => {
      const { trigger, submit } = await setup(
        'data:image/png;base64,aW1hZ2U=',
        viewportWidth,
        viewportHeight,
      );
      const image = screen.getByRole('img', {
        name: 'Image preview',
      }) as HTMLImageElement;
      Object.defineProperties(image, {
        naturalWidth: { value: width },
        naturalHeight: { value: height },
      });
      fireEvent.load(image);
      expect(parseFloat(image.style.width)).toBeCloseTo(expectedWidth);
      expect(parseFloat(image.style.height)).toBeCloseTo(expectedHeight);
      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      fireEvent.click(trigger);
      await screen.findByRole('dialog');
      expect(
        screen
          .getByRole('button', { name: 'Zoom out' })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(submit).not.toHaveBeenCalled();
    },
  );
});
