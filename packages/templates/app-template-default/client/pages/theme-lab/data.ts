import { useTranslation } from '@nocobase/i18n/client';
import { useSyncExternalStore } from 'react';

export const stages = ['lead', 'qualified', 'proposal', 'won'] as const;
export type Stage = (typeof stages)[number];
export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  industry: string;
  owner: string;
  stage: Stage;
  amount: number;
  updated: string;
}

// Synthetic preview records only. Nothing is sent to or read from an application API.
const initialCustomers: Customer[] = [
  [
    '1',
    '云岚科技',
    '林悦',
    'lin.yue@example.com',
    'SaaS',
    'Alex Chen',
    'proposal',
    128000,
    '2026-10-08',
  ],
  [
    '2',
    'Northstar Studio',
    'Emma Wilson',
    'emma@example.com',
    'Design',
    'Emma Lee',
    'qualified',
    68000,
    '2026-10-07',
  ],
  [
    '3',
    '青禾制造',
    '陈星',
    'chen.xing@example.com',
    'Manufacturing',
    'Alex Chen',
    'won',
    246000,
    '2026-10-06',
  ],
  [
    '4',
    'Atlas Commerce',
    'Oliver Brown',
    'oliver@example.com',
    'Retail',
    'Ryan Wu',
    'proposal',
    96000,
    '2026-10-05',
  ],
  [
    '5',
    '森屿设计',
    '宋宁',
    'song.ning@example.com',
    'Design',
    'Emma Lee',
    'lead',
    42000,
    '2026-10-04',
  ],
  [
    '6',
    'Lumen Systems',
    'Sofia Martin',
    'sofia@example.com',
    'SaaS',
    'Ryan Wu',
    'qualified',
    185000,
    '2026-10-03',
  ],
  [
    '7',
    '远川物流',
    '许安',
    'xu.an@example.com',
    'Logistics',
    'Alex Chen',
    'won',
    312000,
    '2026-10-02',
  ],
  [
    '8',
    'Orbit Labs',
    'Noah Davis',
    'noah@example.com',
    'SaaS',
    'Emma Lee',
    'lead',
    79000,
    '2026-10-01',
  ],
].map(
  ([id, name, contact, email, industry, owner, stage, amount, updated]) => ({
    id: String(id),
    name: String(name),
    contact: String(contact),
    email: String(email),
    industry: String(industry),
    owner: String(owner),
    stage: stage as Stage,
    amount: Number(amount),
    updated: String(updated),
  }),
);
let customers = initialCustomers;
let message = '';
const listeners = new Set<() => void>();
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useCustomers(): Customer[] {
  return useSyncExternalStore(subscribe, () => customers);
}
export function useCreatedMessage(): string {
  return useSyncExternalStore(subscribe, () => message);
}
export function addCustomer(
  input: Pick<Customer, 'name' | 'contact' | 'email' | 'industry'>,
): void {
  const record: Customer = {
    ...input,
    id: crypto.randomUUID(),
    owner: 'Alex Chen',
    stage: 'lead',
    amount: 0,
    updated: new Date().toISOString().slice(0, 10),
  };
  customers = [record, ...customers];
  message = input.name;
  listeners.forEach((listener) => listener());
}

export function useMoney(): (value: number) => string {
  const { i18n } = useTranslation();
  return (value) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(value);
}
