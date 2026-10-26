import {
  defineLifecycle,
  type LifecycleRecord,
  type Lifecycle,
} from '@nocobase/lifecycle';
export type AssetState =
  'idle' | 'issued' | 'loaned' | 'maintenance' | 'scrapped';
export interface Asset extends LifecycleRecord {
  readonly status: AssetState;
  readonly custodianId: string | null;
  readonly priorStatus: string | null;
  readonly dueDate: string | null;
}
interface AssetTypes {
  record: Asset;
  state: AssetState;
}
const custody = (input: Readonly<Record<string, unknown>>) =>
  typeof input.custodianId === 'string' && input.custodianId.length
    ? []
    : [{ field: 'custodianId', message: 'Choose a custodian.' }];
export const assets: Lifecycle<AssetTypes> = defineLifecycle<AssetTypes>({
  name: 'equipmentAssets',
  initial: 'idle',
  states: [
    'idle',
    'issued',
    'loaned',
    'maintenance',
    { name: 'scrapped', final: true },
  ],
  transitions: {
    issue: {
      title: 'Issue',
      from: 'idle',
      to: 'issued',
      validate: custody,
      accept: ['custodianId'],
    },
    borrow: {
      title: 'Lend',
      from: 'idle',
      to: 'loaned',
      validate: custody,
      accept: ['custodianId', 'dueDate'],
    },
    return: {
      title: 'Return',
      from: ['issued', 'loaned'],
      to: 'idle',
      set: () => ({ custodianId: null, dueDate: null }),
    },
    transferIdle: {
      title: 'Transfer',
      from: 'idle',
      to: 'idle',
      accept: ['departmentId', 'locationId'],
    },
    transferIssued: {
      title: 'Transfer',
      from: 'issued',
      to: 'issued',
      validate: custody,
      accept: ['departmentId', 'locationId', 'custodianId'],
    },
    transferLoaned: {
      title: 'Transfer',
      from: 'loaned',
      to: 'loaned',
      validate: custody,
      accept: ['departmentId', 'locationId', 'custodianId'],
    },
    maintainIdle: {
      title: 'Open maintenance',
      from: 'idle',
      to: 'maintenance',
      set: () => ({ priorStatus: 'idle' }),
    },
    maintainIssued: {
      title: 'Open maintenance',
      from: 'issued',
      to: 'maintenance',
      set: () => ({ priorStatus: 'issued' }),
    },
    maintainLoaned: {
      title: 'Open maintenance',
      from: 'loaned',
      to: 'maintenance',
      set: () => ({ priorStatus: 'loaned' }),
    },
    restoreIdle: {
      title: 'Complete maintenance',
      from: 'maintenance',
      to: 'idle',
      guard: ({ record }) => record.priorStatus === 'idle',
      set: () => ({ priorStatus: null }),
    },
    restoreIssued: {
      title: 'Complete maintenance',
      from: 'maintenance',
      to: 'issued',
      guard: ({ record }) => record.priorStatus === 'issued',
      set: () => ({ priorStatus: null }),
    },
    restoreLoaned: {
      title: 'Complete maintenance',
      from: 'maintenance',
      to: 'loaned',
      guard: ({ record }) => record.priorStatus === 'loaned',
      set: () => ({ priorStatus: null }),
    },
    scrap: {
      title: 'Scrap asset',
      from: 'idle',
      to: 'scrapped',
      validate: (input) =>
        typeof input.reason === 'string' && input.reason.trim()
          ? []
          : [{ field: 'reason', message: 'Give a reason.' }],
    },
    editIdle: {
      title: 'Update details',
      from: 'idle',
      to: 'idle',
      accept: [
        'assetNumber',
        'name',
        'serialNumber',
        'model',
        'manufacturer',
        'categoryId',
        'departmentId',
        'locationId',
        'purchaseDate',
        'purchaseCost',
        'vendor',
        'warrantyUntil',
        'nextMaintenanceAt',
        'notes',
      ],
    },
    editIssued: {
      title: 'Update details',
      from: 'issued',
      to: 'issued',
      accept: [
        'assetNumber',
        'name',
        'serialNumber',
        'model',
        'manufacturer',
        'categoryId',
        'purchaseDate',
        'purchaseCost',
        'vendor',
        'warrantyUntil',
        'nextMaintenanceAt',
        'notes',
      ],
    },
    editLoaned: {
      title: 'Update details',
      from: 'loaned',
      to: 'loaned',
      accept: [
        'assetNumber',
        'name',
        'serialNumber',
        'model',
        'manufacturer',
        'categoryId',
        'purchaseDate',
        'purchaseCost',
        'vendor',
        'warrantyUntil',
        'nextMaintenanceAt',
        'notes',
      ],
    },
    editMaintenance: {
      title: 'Update details',
      from: 'maintenance',
      to: 'maintenance',
      accept: [
        'assetNumber',
        'name',
        'serialNumber',
        'model',
        'manufacturer',
        'categoryId',
        'purchaseDate',
        'purchaseCost',
        'vendor',
        'warrantyUntil',
        'nextMaintenanceAt',
        'notes',
      ],
    },
  },
});
interface Request extends LifecycleRecord {
  readonly status: 'pending' | 'completed' | 'rejected';
}
interface RequestTypes {
  record: Request;
  state: Request['status'];
}
export const requests = defineLifecycle<RequestTypes>({
  name: 'equipmentRequests',
  initial: 'pending',
  states: [
    'pending',
    { name: 'completed', final: true },
    { name: 'rejected', final: true },
  ],
  transitions: {
    complete: {
      from: 'pending',
      to: 'completed',
      accept: ['handledById', 'resolution'],
    },
    reject: {
      from: 'pending',
      to: 'rejected',
      accept: ['handledById', 'resolution'],
    },
  },
});
interface OpenRecord extends LifecycleRecord {
  readonly status: 'open' | 'completed';
}
interface OpenTypes {
  record: OpenRecord;
  state: OpenRecord['status'];
}
export const maintenance = defineLifecycle<OpenTypes>({
  name: 'equipmentMaintenance',
  initial: 'open',
  states: ['open', { name: 'completed', final: true }],
  transitions: {
    complete: { from: 'open', to: 'completed', accept: ['resolution', 'cost'] },
  },
});
export const stocktakes = defineLifecycle<OpenTypes>({
  name: 'equipmentStocktakes',
  initial: 'open',
  states: ['open', { name: 'completed', final: true }],
  transitions: {
    observe: { from: 'open', to: 'open' },
    complete: { from: 'open', to: 'completed' },
  },
});
export const definitions = [assets, requests, maintenance, stocktakes] as const;
