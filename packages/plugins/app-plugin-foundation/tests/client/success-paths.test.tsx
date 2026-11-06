import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import plugin from '../../client/plugin.js';
import { ModuleMatrix } from '../../client/components/module-matrix.js';
import { businessModules } from '../../client/business-modules.js';
import type {
  FoundationApiCondition,
  FoundationCapability,
} from '../../shared/foundation.js';

it.each([true, false])(
  'distinguishes conditional=%s API evidence and preserves its provenance in the matrix',
  async (conditional) => {
    const conditions: FoundationApiCondition[] = conditional
      ? [
          {
            kind: 'databaseAvailable',
            source: '@nocobase/db#databaseManagerToken',
          },
          {
            kind: 'authenticated',
            source:
              '@nocobase/app-plugin-authentication#authenticationToken.required',
          },
          { kind: 'bodyWithinLimit', source: 'hono/body-limit#bodyLimit' },
          {
            kind: 'validInput',
            source: '@nocobase/app-server/router#apiValidator',
          },
        ]
      : [];
    const modules = businessModules(
      [
        {
          id: 'app:catalog',
          name: 'catalog',
          packageName: 'app',
          source: 'application',
          path: '/catalog',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'Catalog' },
          componentLoader: async () => ({ default: () => null }),
        },
      ],
      {
        complete: true,
        unreadable: [],
        entries: [
          {
            name: '@nocobase/db',
            version: '1',
            installed: true,
            kind: 'core',
            origin: 'nocobase',
            categories: ['dataModeling'],
            registration: 'observed',
            evidence: ['serverRegistration'],
          },
        ],
      },
      {
        complete: true,
        routes: [
          {
            packageName: 'app',
            routeName: 'catalog',
            providers: [],
            apiProviders: ['@nocobase/db'],
            complete: true,
            apiEvidence: [
              {
                method: 'GET',
                path: '/records',
                providers: ['@nocobase/db'],
                conditions,
              },
            ],
          },
        ],
      },
      ['dataModeling'],
    );
    expect(modules[0]?.links[0]?.apiEvidence?.[0]?.conditions).toEqual(
      conditions,
    );
    const capability: FoundationCapability = {
      key: 'dataModeling',
      status: 'active',
      parts: [],
      packages: [],
      metrics: [],
      facts: [],
      completeness: 'complete',
      issues: [],
    };
    await renderWithApp(
      <ModuleMatrix
        modules={modules.map((item) => ({ ...item, title: 'Catalog' }))}
        capabilities={[capability]}
        onSelect={() => {}}
        onFocusModule={() => {}}
      />,
      { plugins: [plugin()] },
    );
    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Inspect Catalog × Data modeling',
      })[0]!,
    );
    const detail = within(screen.getByRole('status'));
    expect(
      detail.getByText(
        conditional
          ? 'Successful API request: GET /records'
          : 'API request: GET /records',
      ),
    ).toBeTruthy();
    if (conditional) {
      for (const label of [
        'Database is available',
        'Authentication is accepted',
        'Request body is within the limit',
        'Input validation succeeds',
      ])
        expect(detail.getByText(label, { exact: false })).toBeTruthy();
      for (const condition of conditions)
        expect(detail.getByText(condition.source)).toBeTruthy();
    } else
      expect(
        detail.queryByText('Database is available', { exact: false }),
      ).toBeNull();
  },
);
