import { createAppClientConfig } from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import file from '../client/index.js';
import { useFileUploadLimit } from '../client/upload-limits.js';

function Limit({ disk }: { disk?: string }) {
  const limit = useFileUploadLimit(disk);
  return (
    <p>
      {limit.disk}: {limit.maxFileSizeMb} MB
    </p>
  );
}

it('starts and reads the selected disk from public config without any request', async () => {
  const fetch = vi.fn(() => Promise.reject(new Error('Network unavailable')));
  const view = await renderWithApp(<Limit />, {
    plugins: [file()],
    fetch,
    services(app) {
      Object.defineProperty(app.config, 'public', {
        value: createAppClientConfig({
          rawConfig: {},
          rawPublicConfig: {
            drive: {
              uploadLimits: {
                default: 'remote',
                disks: {
                  remote: {
                    disk: 'remote',
                    maxFileSizeMb: 50,
                    maxBytes: 50 * 1024 * 1024,
                  },
                  small: {
                    disk: 'small',
                    maxFileSizeMb: 1,
                    maxBytes: 1024 * 1024,
                  },
                },
              },
            },
          },
        }).public,
      });
    },
  });
  expect(screen.getByText('remote: 50 MB')).toBeTruthy();
  view.rerender(<Limit disk='small' />);
  expect(screen.getByText('small: 1 MB')).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

it('starts without published limits and uses 20 MiB without a request', async () => {
  const fetch = vi.fn(() => Promise.reject(new Error('Network unavailable')));
  await renderWithApp(<Limit />, { plugins: [file()], fetch });
  expect(screen.getByText('local: 20 MB')).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

it('renders outside an application with the default disk limit', () => {
  render(<Limit />);
  expect(screen.getByText('local: 20 MB')).toBeTruthy();
});
