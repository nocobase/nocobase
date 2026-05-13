/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface FormRegistryEntry {
  name: string;
}

export interface FormRegistry<T extends FormRegistryEntry> {
  readonly namespace: string;
  register(entry: T): void;
  unregister(name: string): boolean;
  get(name: string): T | undefined;
  has(name: string): boolean;
  list(): T[];
}

/**
 * Create an isolated, namespaced registry of form-like entries.
 *
 * Each call returns a fresh registry instance backed by its own closure-scoped
 * `Map`, so plugins do not share state across namespaces. Plugins that need an
 * extension point for form-shaped registrations (e.g. storage configuration
 * forms, data-source connection forms) can build their own typed registry on
 * top of this primitive instead of re-implementing the same boilerplate.
 *
 * Re-registering the same `name` overwrites the previous entry and emits a
 * console warning. This is intentional so HMR / hot reload works without
 * throwing, while still surfacing unintended duplicates during development.
 */
export function createFormRegistry<T extends FormRegistryEntry>(namespace: string): FormRegistry<T> {
  const entries = new Map<string, T>();

  return {
    namespace,
    register(entry) {
      if (entries.has(entry.name)) {
        console.warn(`[${namespace}] entry "${entry.name}" already registered, overwriting.`);
      }
      entries.set(entry.name, entry);
    },
    unregister(name) {
      return entries.delete(name);
    },
    get(name) {
      return entries.get(name);
    },
    has(name) {
      return entries.has(name);
    },
    list() {
      return Array.from(entries.values());
    },
  };
}
