import { describe, expect, it, vi } from 'vitest';

import { DatabaseExplorerClient } from '../client/database-explorer-client.js';
import plugin from '../client/plugin.js';
import routes, {
  DATABASE_EXPLORER_ACCESS,
  DEFAULT_PANE,
} from '../client/routes.js';
import { DATABASE_EXPLORER_PAGE } from '../server/routes/index.js';

describe('@nocobase/app-plugin-database-explorer Client routes', () => {
  it('contributes one Settings page with a pane route per tab', () => {
    expect(routes).toMatchObject({
      parent: 'settings',
      routes: [
        {
          name: 'database-explorer',
          path: '/database-explorer',
          authz: {
            resource: { type: 'page', id: 'database-explorer' },
            action: 'access',
          },
          navigation: { title: 'nav.databaseExplorer' },
          componentLoader: expect.any(Function),
          children: [
            {
              name: 'database-explorer.fields',
              path: 'fields',
              authz: {
                resource: { type: 'page', id: 'database-explorer' },
                action: 'access',
              },
            },
            {
              name: 'database-explorer.columns',
              path: 'columns',
              authz: {
                resource: { type: 'page', id: 'database-explorer' },
                action: 'access',
              },
            },
          ],
        },
      ],
    });
  });

  it('resolves every lazy component it declares', async () => {
    // Executing the loaders is the point: asserting they are functions would
    // pass for a route pointing at a module that cannot be resolved at all.
    const page = routes.routes[0];
    await expect(page?.componentLoader?.()).resolves.toMatchObject({
      default: expect.any(Function),
    });
    for (const child of page?.children ?? []) {
      await expect(child.componentLoader?.()).resolves.toMatchObject({
        default: expect.any(Function),
      });
    }
  });

  it('guards every pane, not only the page that lists them', () => {
    // A Settings child Route without `access` is reachable without the grant,
    // and the application's Client inspection reports it as an issue.
    for (const child of routes.routes[0]?.children ?? []) {
      expect(child.authz).toEqual(DATABASE_EXPLORER_ACCESS);
    }
  });

  it('opens on the pane its parent redirects to', () => {
    expect(routes.routes[0]?.children?.[0]?.path).toBe(DEFAULT_PANE);
  });

  it('guards the page with the resource the server checks', () => {
    // One grant governs the navigation entry and the API; the two halves of
    // that contract can only stay aligned if they name the same resource.
    expect(DATABASE_EXPLORER_ACCESS.resource).toEqual({
      type: 'page',
      id: DATABASE_EXPLORER_PAGE,
    });
    expect(DATABASE_EXPLORER_ACCESS.action).toBe('access');
  });

  it('registers as a client plugin with its locales', () => {
    expect(plugin).toEqual(expect.any(Function));
  });
});

describe('DatabaseExplorerClient', () => {
  it('reads connections without a query', async () => {
    const { client, request } = fakeApi();

    await client.connections();

    expect(request).toHaveBeenCalledWith({
      path: 'databaseExplorer/connections',
      query: {},
    });
  });

  it('escapes a connection name that needs it', async () => {
    const { client, request } = fakeApi();

    await client.collections('external/crm');

    expect(request).toHaveBeenCalledWith({
      path: 'databaseExplorer/connections/external%2Fcrm/collections',
      query: {},
    });
  });

  it('sends a page token back unchanged', async () => {
    const { client, request } = fakeApi();

    await client.collections('main', {
      pageSize: 25,
      pageToken: 'opaque+blob=',
    });

    expect(request).toHaveBeenCalledWith({
      path: 'databaseExplorer/connections/main/collections',
      query: { pageSize: 25, pageToken: 'opaque+blob=' },
    });
  });

  it('omits paging options that were not given', async () => {
    const { client, request } = fakeApi();

    await client.collections('main', { pageSize: 10 });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ query: { pageSize: 10 } }),
    );
  });

  it('addresses a collection and its physical schema separately', async () => {
    const { client, request } = fakeApi();

    await client.collection('main', 'order items');
    await client.physicalCollection('main', 'order items');

    expect(request.mock.calls.map(([options]) => options.path)).toEqual([
      'databaseExplorer/connections/main/collections/order%20items',
      'databaseExplorer/connections/main/collections/order%20items/physicalSchema',
    ]);
  });

  it('follows the page token so a search sees every collection', async () => {
    const { client, request } = fakeApi();
    request
      .mockResolvedValueOnce({
        data: [{ name: 'a' }],
        meta: { nextPageToken: 'c1' },
      })
      .mockResolvedValueOnce({
        data: [{ name: 'b' }],
        meta: { nextPageToken: 'c2' },
      })
      .mockResolvedValueOnce({ data: [{ name: 'c' }], meta: {} });

    await expect(client.allCollections('main')).resolves.toEqual({
      items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      truncated: false,
    });
    expect(request.mock.calls.map(([options]) => options.query)).toEqual([
      { pageSize: 100 },
      { pageSize: 100, pageToken: 'c1' },
      { pageSize: 100, pageToken: 'c2' },
    ]);
  });

  it('stops and says so rather than following a page token forever', async () => {
    const { client, request } = fakeApi();
    request.mockResolvedValue({
      data: [{ name: 'a' }],
      meta: { nextPageToken: 'c' },
    });

    const result = await client.allCollections('main', 3);

    expect(result.truncated).toBe(true);
    expect(result.items).toHaveLength(3);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('unwraps the list envelope and names the default connection', async () => {
    const { client, request } = fakeApi();
    const items = [
      { name: 'crm', isDefault: false },
      { name: 'main', isDefault: true },
    ];
    request.mockResolvedValue({ data: items, meta: { total: 2 } });

    await expect(client.connections()).resolves.toEqual({
      default: 'main',
      items,
    });
  });

  it('reports no default when no connection is marked', async () => {
    const { client, request } = fakeApi();
    request.mockResolvedValue({ data: [], meta: { total: 0 } });

    await expect(client.connections()).resolves.toEqual({
      default: null,
      items: [],
    });
  });
});

function fakeApi() {
  const request = vi.fn().mockResolvedValue({ data: [], meta: {} });
  return {
    request,
    client: new DatabaseExplorerClient({
      request,
    } as unknown as ConstructorParameters<typeof DatabaseExplorerClient>[0]),
  };
}
