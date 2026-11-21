import { useNavigationGuard } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useEffect, useRef, useState } from 'react';

export interface Customer {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'closed';
  ownerId: string;
  notes: string;
}
export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
}
export interface Option {
  id: string;
  name: string;
  active?: boolean;
}
export interface List<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number };
}
export interface BatchResult {
  items: (
    | { id: string; outcome: 'updated' }
    | { id: string; outcome: 'failed'; reason: 'FORBIDDEN' | 'STATE_CONFLICT' }
  )[];
  updated: number;
  failed: number;
}
export const base = 'customerContacts';
/**
 * What each view reads, for `useListData(..., { scopes })` and `announceDataChange`. A write to a customer or to its
 * contacts overlaps the customer list, the customer and its contacts, so each of them reads again or takes the result.
 */
export const customersScope = `${base}/customers`;
export const customerScope = (id: string) => `${customersScope}/${id}`;
export const contactsScope = (customerId: string) =>
  `${customerScope(customerId)}/contacts`;
export function useCrmAction(resource: string, action: string) {
  return useCan({
    resource: { type: 'composite', id: `example.crm.${resource}` },
    action,
  });
}
export function useWriteLock() {
  const lockRef = useRef(false);
  const [busy, setBusy] = useState(false);
  useNavigationGuard(() => !lockRef.current);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (lockRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
  return {
    busy,
    locked: () => lockRef.current,
    acquire: () => {
      if (lockRef.current) return false;
      lockRef.current = true;
      setBusy(true);
      return true;
    },
    release: () => {
      lockRef.current = false;
      setBusy(false);
    },
  };
}
