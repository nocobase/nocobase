import {
  render as renderWithoutToasts,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import {
  createElement,
  type JSXElementConstructor,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { ToastHost } from './toast-host.js';

/**
 * Renders inside the stand-in toaster that Hub pages need, as the application's own does. A `wrapper` given here, such
 * as the i18n provider, is mounted inside the toaster.
 */
export function render(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult {
  const Inner = options?.wrapper as
    JSXElementConstructor<PropsWithChildren> | undefined;
  const wrapper = Inner
    ? ({ children }: PropsWithChildren): ReactElement =>
        createElement(ToastHost, null, createElement(Inner, null, children))
    : ToastHost;
  return renderWithoutToasts(ui, { ...options, wrapper });
}
