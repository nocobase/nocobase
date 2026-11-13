import { describe, expect, it } from 'vitest';

import { pushManifest } from '../../server/index.js';

describe('pushManifest', () => {
  it('keeps the installed identity existing applications were installed with', () => {
    expect(
      pushManifest('/apps/studio/', {
        name: 'NocoBase Studio',
        shortName: 'Studio',
        themeColor: '#002ad1',
        backgroundColor: '#ffffff',
        icons: [
          { src: '/assets/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      }),
    ).toEqual({
      id: '/apps/studio/',
      name: 'NocoBase Studio',
      short_name: 'Studio',
      description: undefined,
      start_url: '/apps/studio/',
      scope: '/apps/studio/',
      display: 'standalone',
      theme_color: '#002ad1',
      background_color: '#ffffff',
      icons: [
        {
          src: '/apps/studio/assets/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/apps/studio/assets/pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });
  });
});
