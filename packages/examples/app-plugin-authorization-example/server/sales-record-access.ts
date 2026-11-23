import {
  defineRecordAccess,
  type RecordAccessBuilder,
} from '@nocobase/authorization/core';
import { buildFilter } from '@nocobase/repository-input';
import type { DatabaseManager } from '@nocobase/db';
import { label, PROJECTS, QUOTES, ORDERS } from '../catalog.js';
import {
  resolveOwnedSalesRecords,
  resolveRegionalSalesRecords,
  resolvePublicSalesRecords,
} from './sales-scopes.js';

/** Construct declarations with application-owned dependencies; registration stays in the Provider. */
export function createSalesRecordAccess(
  database: DatabaseManager,
): readonly RecordAccessBuilder<string>[] {
  return [
    defineRecordAccess('example.sales.prepared', (access) =>
      access
        .title(label('sales.scope.prepared'))
        .personal()
        .collections(QUOTES)
        .resolver(({ principal }) =>
          buildFilter((filter) =>
            filter.string('preparedById').eq(principal.id),
          ),
        ),
    ),
    defineRecordAccess('example.sales.own', (access) =>
      access
        .title(label('sales.scope.own'))
        .personal()
        .collections(QUOTES, ORDERS)
        .resolver((context) => resolveOwnedSalesRecords(database, context)),
    ),
    defineRecordAccess('example.sales.region', (access) =>
      access
        .title(label('sales.scope.region'))
        .personal()
        .collections(PROJECTS, QUOTES, ORDERS)
        .resolver((context) => resolveRegionalSalesRecords(database, context)),
    ),
    defineRecordAccess('example.sales.public', (access) =>
      access
        .title(label('sales.scope.public'))
        .collections(PROJECTS, QUOTES, ORDERS)
        .resolver((context) => resolvePublicSalesRecords(database, context)),
    ),
  ];
}
