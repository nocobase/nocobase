/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { createMemoryRouter, Outlet, RouterProvider, useParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { KeepAlive } from '../KeepAlive';

describe('KeepAlive', () => {
  it('keeps inactive outlet pages mounted while switching route params', async () => {
    const events: string[] = [];

    const Page = () => {
      const { name } = useParams();
      useEffect(() => {
        events.push(`mount:${name}`);
        return () => {
          events.push(`unmount:${name}`);
        };
      }, [name]);

      return <div>page {name}</div>;
    };

    const Layout = () => {
      const { name } = useParams();
      return <KeepAlive uid={name || ''}>{() => <Outlet />}</KeepAlive>;
    };

    const router = createMemoryRouter(
      [
        {
          path: '/:name',
          element: <Layout />,
          children: [{ index: true, element: <Page /> }],
        },
      ],
      {
        initialEntries: ['/page-a'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('page page-a')).toBeInTheDocument();

    await router.navigate('/page-b');

    expect(await screen.findByText('page page-b')).toBeInTheDocument();
    expect(screen.getByText('page page-a')).toBeInTheDocument();

    await waitFor(() => {
      expect(events).toEqual(['mount:page-a', 'mount:page-b']);
    });
  });
});
