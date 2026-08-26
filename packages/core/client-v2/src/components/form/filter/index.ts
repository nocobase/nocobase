/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Higher-level filter compositions for non-schema surfaces (settings pages, panels, side drawers). The low-level primitives — `FilterContainer`, `FilterGroup`, `FilterItem`, `fieldsToOptions`, `useFilterOptions` — live under `src/flow/components/filter/`; this layer composes them with a `Collection` binding and exposes the hook/component pair callers actually reach for. The dependency direction is form/filter → flow/components/filter only.
export { CollectionFilter } from './CollectionFilter';
export type { CollectionFilterProps } from './CollectionFilter';
export { CollectionFilterPanel } from './CollectionFilterPanel';
export type { CollectionFilterPanelProps, CollectionFilterPanelRef } from './CollectionFilterPanel';
export type { CompiledFilter } from './useFilterActionProps';
