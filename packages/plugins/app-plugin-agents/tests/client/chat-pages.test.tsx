// @vitest-environment jsdom
import {
  ClientApplicationContext,
  type ClientApplication,
} from '@nocobase/app-client';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { useChatPages } from '../../client/chat/chat-pages.js';

const loader = async () => ({ default: () => null });

function withRoutes(routes: readonly object[]) {
  const app = { runtime: { routes } } as unknown as ClientApplication;
  return function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <ClientApplicationContext.Provider value={app}>
        {children}
      </ClientApplicationContext.Provider>
    );
  };
}

describe('useChatPages', () => {
  it('finds the plugin pages or an application page at the chat path', () => {
    const { result } = renderHook(() => useChatPages('/chat'), {
      wrapper: withRoutes([
        { path: '/chat', componentLoader: loader },
        {
          path: '/workspace',
          children: [{ path: '/chat/:id', componentLoader: loader }],
        },
      ]),
    });
    expect(result.current).toEqual({ list: true, detail: true });
  });

  it('reports no pages when the application leaves the chat path empty', () => {
    const { result } = renderHook(() => useChatPages('/chat'), {
      wrapper: withRoutes([
        { path: '/chat', children: [] },
        { path: '/chat/settings/:id', componentLoader: loader },
        { path: '/chatroom/:id', componentLoader: loader },
      ]),
    });
    expect(result.current).toEqual({ list: false, detail: false });
  });

  it('assumes both pages outside an application', () => {
    const { result } = renderHook(() => useChatPages('/chat'));
    expect(result.current).toEqual({ list: true, detail: true });
  });
});
