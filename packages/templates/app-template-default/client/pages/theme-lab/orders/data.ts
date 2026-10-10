import { useSyncExternalStore } from 'react';

export const statuses = ['draft', 'processing', 'completed'] as const;
export type OrderStatus = (typeof statuses)[number];
export interface OrderValues {
  customer: string;
  email: string;
  product: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  note: string;
}
export interface Order extends OrderValues {
  id: string;
  number: string;
  updated: string;
}
const customers = [
  '云岚科技',
  'Northstar Studio',
  '青禾制造',
  'Atlas Commerce',
  '森屿设计',
  'Lumen Systems',
  '远川物流',
  'Orbit Labs',
  '华东联合智能制造与供应链技术服务有限公司',
];
const fixtures: Order[] = Array.from({ length: 18 }, (_, index) => ({
  id: String(index + 1),
  number: `SO-2026-${String(index + 1).padStart(4, '0')}`,
  customer: customers[index % customers.length],
  email: `buyer${index + 1}@example.com`,
  product: ['NocoBase Enterprise', 'Implementation service', 'Support package'][
    index % 3
  ],
  quantity: (index % 4) + 1,
  price: [12800, 6800, 3600][index % 3],
  status: statuses[index % 3],
  note:
    index % 2
      ? ''
      : 'Please confirm the delivery plan.\nContact the project owner before handover.',
  updated: new Date(Date.UTC(2026, 9, 1 + index)).toISOString(),
}));
let rows = fixtures.map((row) => ({ ...row }));
let sequence = rows.length;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const useOrders = () => useSyncExternalStore(subscribe, () => rows);
export function saveOrder(values: OrderValues, id?: string): Order {
  const existing = id ? rows.find((row) => row.id === id) : undefined;
  if (id && !existing) throw new Error('Preview order no longer exists');
  const nextId = existing?.id ?? String(++sequence);
  const row = {
    ...values,
    id: nextId,
    number: existing?.number ?? `SO-2026-${nextId.padStart(4, '0')}`,
    updated: new Date().toISOString(),
  };
  rows = existing
    ? rows.map((item) => (item.id === id ? row : item))
    : [row, ...rows];
  notify();
  return row;
}
export function completeOrders(ids: string[]): void {
  const selected = new Set(ids);
  rows = rows.map((row) =>
    selected.has(row.id)
      ? { ...row, status: 'completed', updated: new Date().toISOString() }
      : row,
  );
  notify();
}
export interface WorkspaceValues {
  business: string;
  email: string;
  region: string;
  note: string;
}
let workspace = {
  profile: {
    business: 'NocoBase Studio',
    email: 'team@example.com',
    region: 'CN',
    note: '',
  },
  emailUpdates: true,
  reminders: false,
};
export const useWorkspace = () =>
  useSyncExternalStore(subscribe, () => workspace);
export function saveWorkspace(profile: WorkspaceValues): void {
  workspace = { ...workspace, profile };
  notify();
}
export function setWorkspaceSwitch(
  key: 'emailUpdates' | 'reminders',
  value: boolean,
): void {
  workspace = { ...workspace, [key]: value };
  notify();
}
