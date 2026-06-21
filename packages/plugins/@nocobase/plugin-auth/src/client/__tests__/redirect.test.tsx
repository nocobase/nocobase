/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useRedirect } from '../basic/hooks';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

function RedirectRunner() {
  const redirect = useRedirect();

  React.useEffect(() => {
    redirect();
  }, [redirect]);

  return null;
}

describe('auth redirect in v1 signin', () => {
  const originalLocation = globalThis.window.location;

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    mockedNavigate.mockReset();
    vi.restoreAllMocks();
  });

  it('should use hard redirect when target path points to v2', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace,
      },
    });

    render(
      <MemoryRouter initialEntries={['/signin?redirect=%2Fv2%2Fadmin%2Fl659chbg3fd']}>
        <RedirectRunner />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/v2/admin/l659chbg3fd');
    });
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('should use hard redirect when target path points to prefixed v2 route', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:20000',
        replace,
      },
    });

    render(
      <MemoryRouter initialEntries={['/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2Fl659chbg3fd']}>
        <RedirectRunner />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/nocobase/v2/admin/l659chbg3fd');
    });
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('should keep SPA navigate for v1 targets', async () => {
    render(
      <MemoryRouter initialEntries={['/signin?redirect=%2Fadmin']}>
        <RedirectRunner />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });
});
