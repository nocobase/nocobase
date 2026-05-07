/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FORMAL_FLOW_SURFACE_BLOCK_KEYS,
  FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX,
  type FormalFlowSurfaceBlockKey,
} from '../../flow-surfaces/support-matrix';

export { FORMAL_FLOW_SURFACE_BLOCK_KEYS };
export type { FormalFlowSurfaceBlockKey };

export type FlowSurfaceFixtureSampleKind = 'minimal' | 'representative';
export type FlowSurfaceFixtureCaptureStatus = 'captured' | 'pending';
export type FlowSurfaceFixtureSourceKind = 'frontend-live-db' | 'live-flowPages-api';
export type FlowSurfaceReadbackParity = 'implemented' | 'pending';
export type FlowSurfaceCreateParity = 'implemented' | 'pending';

export type FlowSurfaceFixtureManifestFixture = {
  name: string;
  modelUid: string;
  pageRouteId?: number;
  sampleKind: FlowSurfaceFixtureSampleKind;
  captureStatus: FlowSurfaceFixtureCaptureStatus;
  sourceKind: FlowSurfaceFixtureSourceKind;
  notes?: string;
};

export type FlowSurfaceFixtureManifestEntry = {
  key: FormalFlowSurfaceBlockKey;
  label: string;
  ownerPlugin: string;
  modelUse: string;
  topLevelAddable: boolean;
  fixtureCaptured: boolean;
  readbackParity: FlowSurfaceReadbackParity;
  createParity: FlowSurfaceCreateParity;
  fixtures: FlowSurfaceFixtureManifestFixture[];
};

export type FlowSurfaceCreateParityFixtureEntry = FlowSurfaceFixtureManifestEntry & {
  createParityFixture: FlowSurfaceFixtureManifestFixture;
};

const FIXTURE_SAMPLES: Record<FormalFlowSurfaceBlockKey, FlowSurfaceFixtureManifestFixture[]> = {
  'js-block': [
    {
      name: 'js-block-live',
      modelUid: 'd0b8c4a4e6f',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block click (JS block).',
    },
  ],
  table: [
    {
      name: 'table-block-live',
      modelUid: 'c2pkrw9t20qa',
      pageRouteId: 355788225118208,
      sampleKind: 'representative',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
    },
  ],
  calendar: [
    {
      name: 'calendar-block-live',
      modelUid: 'fcal9b1ock1',
      pageRouteId: 355813771010048,
      sampleKind: 'representative',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes:
        'Captured as a flow-model CalendarBlockModel baseline with deterministic quick-create and event-view popup hosts.',
    },
  ],
  kanban: [
    {
      name: 'kanban-block-live',
      modelUid: 'fkanban9ock1',
      pageRouteId: 355813771010048,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'live-flowPages-api',
      notes: 'Flow Surface generated kanban baseline with deterministic card-item and hidden popup hosts.',
    },
  ],
  'create-form': [
    {
      name: 'create-form-block-live',
      modelUid: 'fuph0cstiq37',
      pageRouteId: 355788225118208,
      sampleKind: 'representative',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
    },
  ],
  'edit-form': [
    {
      name: 'edit-form-block-live',
      modelUid: 'tys4wruosezl',
      pageRouteId: 355788225118208,
      sampleKind: 'representative',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
    },
  ],
  details: [
    {
      name: 'details-block-live',
      modelUid: 'plmj6eypi4t8',
      pageRouteId: 355788225118208,
      sampleKind: 'representative',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
    },
  ],
  'filter-form': [
    {
      name: 'filter-form-block-live',
      modelUid: 'mzckbqd41sk1',
      pageRouteId: 355788225118208,
      sampleKind: 'representative',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
    },
  ],
  list: [
    {
      name: 'list-block-live',
      modelUid: 'e4895a8b00a',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block submenu selection (List -> Departments).',
    },
  ],
  'grid-card': [
    {
      name: 'grid-card-block-live',
      modelUid: 'f38e8dc8ccf',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block submenu selection (Grid card -> Departments).',
    },
  ],
  markdown: [
    {
      name: 'markdown-block-live',
      modelUid: 'b85e0083958',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block click (Markdown).',
    },
  ],
  iframe: [
    {
      name: 'iframe-block-live',
      modelUid: 'b9813bccd6f',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block click (Iframe).',
    },
  ],
  map: [
    {
      name: 'map-block-live',
      modelUid: '0qc9kdp2a4q',
      pageRouteId: 355812950409216,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'live-flowPages-api',
      notes:
        'Frontend add-block was re-verified on 2026-03-28. Map -> Users reaches the real field selection modal, but the current live data exposes no selectable Map field option, so frontend-live capture is blocked by dataset prerequisites.',
    },
  ],
  chart: [
    {
      name: 'chart-block-live',
      modelUid: 'd8c5785c9db',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block click (Charts).',
    },
  ],
  comments: [
    {
      name: 'comments-block-live',
      modelUid: 'x9yrzgi2slh',
      pageRouteId: 355812950409216,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'live-flowPages-api',
      notes:
        'Frontend add-block was re-verified on 2026-03-28. The Comments submenu search returns "No data" for users, Tts Tickets, and nb_tts_tickets in the current live dataset, so frontend-live capture is still blocked.',
    },
  ],
  'action-panel': [
    {
      name: 'action-panel-block-live',
      modelUid: 'e257bfae7d8',
      pageRouteId: 355812088348672,
      sampleKind: 'minimal',
      captureStatus: 'captured',
      sourceKind: 'frontend-live-db',
      notes: 'Captured from Fixture Blocks via real frontend add-block click (Action panel).',
    },
  ],
};

export const FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST: FlowSurfaceFixtureManifestEntry[] =
  FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => ({
    key: entry.formalKey,
    label: entry.label,
    ownerPlugin: entry.ownerPlugin,
    modelUse: entry.modelUse,
    topLevelAddable: entry.topLevelAddable,
    fixtureCaptured: entry.fixtureCaptured,
    readbackParity: entry.readbackSupported ? 'implemented' : 'pending',
    createParity: entry.createSupported ? 'implemented' : 'pending',
    fixtures: FIXTURE_SAMPLES[entry.formalKey] || [],
  }));

export const FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS = FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.filter(
  (entry) => entry.createSupported,
).map((entry) => entry.formalKey) as readonly FormalFlowSurfaceBlockKey[];

export const FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS: readonly FormalFlowSurfaceBlockKey[] = [
  'table',
  'calendar',
  'create-form',
  'edit-form',
  'details',
  'filter-form',
];

export const FORMAL_FLOW_SURFACE_MINIMAL_CREATE_PARITY_BLOCK_KEYS = FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS.filter(
  (key) => !FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS.includes(key),
) as readonly FormalFlowSurfaceBlockKey[];

const REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS = new Set<FormalFlowSurfaceBlockKey>(
  FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS,
);

function selectCreateParityFixture(entry: FlowSurfaceFixtureManifestEntry) {
  const preferredSampleKind = REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS.has(entry.key) ? 'representative' : undefined;
  const capturedFixtures = entry.fixtures.filter((fixture) => fixture.captureStatus === 'captured');
  const fixture =
    capturedFixtures.find((item) => !preferredSampleKind || item.sampleKind === preferredSampleKind) ||
    capturedFixtures[0];

  if (!fixture) {
    throw new Error(`Missing captured create parity fixture for formal block '${entry.key}'`);
  }

  return fixture;
}

export const FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST: FlowSurfaceCreateParityFixtureEntry[] =
  FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST.filter((entry) =>
    FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS.includes(entry.key),
  ).map((entry) => ({
    ...entry,
    createParityFixture: selectCreateParityFixture(entry),
  }));

export function getAllFormalFlowSurfaceFixtureNames() {
  return FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST.flatMap((entry) => entry.fixtures.map((fixture) => fixture.name));
}
