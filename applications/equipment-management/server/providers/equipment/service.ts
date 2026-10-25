import { randomUUID } from 'node:crypto';
import type {
  DatabaseManager,
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
  FilterAst,
  FilterNode,
} from '@nocobase/db';
import { buildFilter } from '@nocobase/repository-input';
import {
  LifecycleRuntime,
  type LifecycleTransaction,
  type JsonObject,
} from '@nocobase/lifecycle';
import { ApiError } from '@nocobase/app-server/router';
import {
  AssetInput,
  type AssetValues,
  type ListValues,
} from '../../routes/equipment-schemas.js';
import { readCsv, writeCsv } from './csv.js';
export type Policies = Readonly<Record<string, RepositoryPolicy | false>>;
export type Row = RepositoryRecord;
export function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  )
    return String(value);
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  throw new TypeError('Expected a scalar equipment value.');
}
export function fail(
  reason: string,
  status:
    | 'FAILED_PRECONDITION'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'ALREADY_EXISTS' = 'FAILED_PRECONDITION',
): never {
  throw new ApiError({
    status,
    reason,
    domain: 'equipment',
    message: reason.replaceAll('_', ' ').toLowerCase(),
  });
}
export function policyFor(p: Policies, name: string): RepositoryPolicy {
  const policy = p[name];
  if (!policy) fail('EQUIPMENT_ACCESS_DENIED', 'PERMISSION_DENIED');
  return policy;
}
const actor = (id: string) => ({ id });
const json = (value: object): JsonObject =>
  JSON.parse(JSON.stringify(value)) as JsonObject;
const now = () => new Date().toISOString();
const assetState = (row: Row) => text(row.status);
const suffix = (row: Row) =>
  assetState(row).charAt(0).toUpperCase() + assetState(row).slice(1);
const idOf = (row: Row) => text(row.id);
export class EquipmentService {
  constructor(
    readonly db: DatabaseManager,
    readonly runtime: LifecycleRuntime,
  ) {}
  repo(name: string, p: Policies, connection = this.db.connection()) {
    return connection.repository(name).withPolicy(policyFor(p, name));
  }
  async requireRow(
    name: string,
    id: string,
    p: Policies,
    c = this.db.connection(),
  ): Promise<Row> {
    const row = await this.repo(name, p, c).findOne({ filter: { id } });
    if (!row) fail('RECORD_NOT_FOUND', 'NOT_FOUND');
    return row;
  }
  async writable(
    name: string,
    id: string,
    values: Row,
    p: Policies,
    c: DatabaseConnection,
  ): Promise<Row> {
    const policy = policyFor(p, name);
    if (!policy.update) fail('WRITE_DENIED', 'PERMISSION_DENIED');
    const row = await this.repo(name, p, c)
      .narrow({
        read: policy.update === true ? true : { scope: policy.update.scope },
      })
      .findOne({ filter: { id } });
    if (!row) fail('RECORD_NOT_FOUND', 'NOT_FOUND');
    const valid = await this.repo(name, p, c).validateMutation({
      operation: 'updateOne',
      filter: { id },
      values,
    });
    if (!valid.valid) fail('FIELD_WRITE_DENIED', 'PERMISSION_DENIED');
    return row;
  }
  async create(
    tx: LifecycleTransaction,
    name: string,
    values: Row,
    who: string,
    p: Policies,
  ): Promise<Row> {
    const c = tx.handle as DatabaseConnection;
    const policy = policyFor(p, name);
    if (!policy.create) fail('CREATE_DENIED', 'PERMISSION_DENIED');
    const input = { id: randomUUID(), createdAt: now(), ...values };
    const valid = await this.repo(name, p, c).validateMutation({
      operation: 'createOne',
      values: {
        ...input,
        status: 'initial',
        statusChangedAt: now(),
        lifecycleVersion: 0,
      },
    });
    if (!valid.valid) fail('FIELD_CREATE_DENIED', 'PERMISSION_DENIED');
    const result = await tx.create(name, input, { actor: actor(who) });
    const scoped = await c
      .repository(name)
      .withPolicy({
        ...policy,
        read:
          policy.create === true
            ? policy.read
            : {
                ...(typeof policy.read === 'object'
                  ? policy.read
                  : { fields: undefined }),
                scope: policy.create.scope,
              },
      })
      .findOne({ filter: { id: result.record.id } });
    if (!scoped) fail('CREATE_SCOPE_DENIED', 'PERMISSION_DENIED');
    return scoped;
  }
  async move(
    tx: LifecycleTransaction,
    name: string,
    row: Row,
    transition: string,
    input: Row,
    who: string,
    p: Policies,
    version = Number(row.lifecycleVersion),
    requestId?: string,
  ): Promise<Row> {
    const c = tx.handle as DatabaseConnection;
    const changed: Row = {
      ...input,
      status: text(row.status),
      statusChangedAt: now(),
      lifecycleVersion: Number(row.lifecycleVersion) + 1,
    };
    if (name === 'equipmentAssets') {
      if (transition === 'scrap') delete changed.reason;
      if (transition === 'return') {
        changed.custodianId = null;
        changed.dueDate = null;
      }
      if (transition.startsWith('maintain')) changed.priorStatus = row.status;
      if (transition.startsWith('restore')) changed.priorStatus = null;
    }
    await this.writable(name, idOf(row), changed, p, c);
    const result = await tx.fire(name, idOf(row), transition, {
      actor: actor(who),
      manual: true,
      input: json(input),
      expect: { version },
      ...(requestId ? { requestId } : {}),
    });
    return this.requireRow(name, idOf(result.record as Row), p, c);
  }
  assetFilter(query: ListValues, who: string): FilterAst {
    return buildFilter((f) => {
      const nodes: FilterNode[] = [];
      if (query.q)
        nodes.push(
          f.or([
            f.string('name').includes(query.q),
            f.string('assetNumber').includes(query.q),
            f.string('serialNumber').includes(query.q),
          ]),
        );
      for (const key of ['status', 'categoryId', 'locationId'] as const)
        if (query[key]) nodes.push(f.string(key).eq(query[key]));
      if (query.mine === 'true') nodes.push(f.string('custodianId').eq(who));
      const today = now().slice(0, 10),
        soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      if (query.exception === 'overdue')
        nodes.push(
          f.and([
            f.string('status').eq('loaned'),
            f.date('dueDate').before(today),
          ]),
        );
      if (query.exception === 'warranty')
        nodes.push(
          f.and([
            f.date('warrantyUntil').notBefore(today),
            f.date('warrantyUntil').notAfter(soon),
          ]),
        );
      if (query.exception === 'maintenance')
        nodes.push(
          f.and([
            f.date('nextMaintenanceAt').notAfter(today),
            f.and([
              f.string('status').ne('scrapped'),
              f.string('status').ne('maintenance'),
            ]),
          ]),
        );
      return f.and(nodes);
    });
  }
  async listAssets(q: ListValues, who: string, p: Policies) {
    const repo = this.repo('equipmentAssets', p);
    const filter = this.assetFilter(q, who);
    const [rows, total] = await Promise.all([
      repo.findMany({
        filter,
        limit: q.pageSize,
        offset: (q.page - 1) * q.pageSize,
        sort: (s) => [
          q.order === 'asc' ? s.field(q.sort).asc() : s.field(q.sort).desc(),
          s.field('id').asc(),
        ],
      }),
      repo.count({ filter }),
    ]);
    return { data: rows, meta: { page: q.page, pageSize: q.pageSize, total } };
  }
  async references(values: Row, c: DatabaseConnection) {
    for (const [field, name] of [
      ['categoryId', 'equipmentCategories'],
      ['locationId', 'equipmentLocations'],
      ['departmentId', 'equipmentDepartments'],
    ] as const) {
      const id = values[field];
      if (
        id &&
        !(await c.repository(name).findOne({ filter: { id: text(id) } }))
      )
        fail('INVALID_REFERENCE');
    }
    if (values.custodianId) {
      const user = await c
        .repository('user')
        .findOne({ filter: { id: text(values.custodianId) } });
      if (!user || user.disabledAt) fail('INVALID_CUSTODIAN');
    }
  }
  async createAsset(values: AssetValues, who: string, p: Policies) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      await this.references(values, c);
      if (
        await c
          .repository('equipmentAssets')
          .exists({ filter: { assetNumber: values.assetNumber } })
      )
        fail('DUPLICATE_ASSET_NUMBER', 'ALREADY_EXISTS');
      return this.create(tx, 'equipmentAssets', values, who, p);
    });
  }
  async patchAsset(
    id: string,
    values: Partial<AssetValues>,
    version: number,
    who: string,
    p: Policies,
  ) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const row = await this.requireRow('equipmentAssets', id, p, c);
      if (
        row.status !== 'idle' &&
        ((values.departmentId !== undefined &&
          values.departmentId !== row.departmentId) ||
          (values.locationId !== undefined &&
            values.locationId !== row.locationId))
      )
        fail('USE_TRANSFER_FOR_ASSIGNMENT');
      await this.references(values, c);
      return this.move(
        tx,
        'equipmentAssets',
        row,
        'edit' + suffix(row),
        values,
        who,
        p,
        version,
      );
    });
  }
  async fireAsset(
    id: string,
    transition: string,
    input: Row,
    version: number,
    requestId: string,
    who: string,
    p: Policies,
  ) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const row = await this.requireRow('equipmentAssets', id, p, c);
      if (transition === 'borrow') {
        if (!input.dueDate || text(input.dueDate) <= now().slice(0, 10))
          fail('FUTURE_DUE_DATE_REQUIRED');
      }
      if (transition === 'issue' && input.dueDate)
        fail('ISSUE_HAS_NO_DUE_DATE');
      if (transition === 'scrap') {
        const open = await this.repo('equipmentRequests', p, c).count({
          filter: { deviceId: id, status: 'pending' },
        });
        if (open) fail('OPEN_REQUESTS_EXIST');
      }
      if (
        transition.startsWith('transfer') &&
        (!input.locationId || !input.departmentId)
      )
        fail('TRANSFER_DESTINATION_REQUIRED');
      await this.references(input, c);
      return this.move(
        tx,
        'equipmentAssets',
        row,
        transition,
        input,
        who,
        p,
        version,
        requestId,
      );
    });
  }
  async createRequest(values: Row, who: string, p: Policies) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const asset = await this.requireRow(
        'equipmentAssets',
        text(values.deviceId),
        p,
        c,
      );
      const kind = values.kind;
      if (
        ['return', 'repair', 'transfer'].includes(text(kind)) &&
        asset.custodianId !== who
      )
        fail('OWN_EQUIPMENT_ONLY', 'PERMISSION_DENIED');
      if (['issue', 'borrow'].includes(text(kind)) && asset.status !== 'idle')
        fail('EQUIPMENT_NOT_AVAILABLE');
      if (
        kind === 'borrow' &&
        (!values.dueDate || text(values.dueDate) <= now().slice(0, 10))
      )
        fail('FUTURE_DUE_DATE_REQUIRED');
      const pending = await this.repo('equipmentRequests', p, c).count({
        filter: {
          deviceId: text(values.deviceId),
          requesterId: who,
          status: 'pending',
        },
      });
      if (pending) fail('REQUEST_ALREADY_PENDING', 'ALREADY_EXISTS');
      return this.create(
        tx,
        'equipmentRequests',
        { ...values, requesterId: who },
        who,
        p,
      );
    });
  }
  async handleRequest(id: string, body: Row, who: string, p: Policies) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const request = await this.requireRow('equipmentRequests', id, p, c);
      if (request.status !== 'pending') fail('REQUEST_ALREADY_HANDLED');
      if (body.decision === 'complete') {
        const asset = await this.requireRow(
          'equipmentAssets',
          text(request.deviceId),
          p,
          c,
        );
        let transition = text(request.kind);
        let input: Row = {};
        if (transition === 'issue' || transition === 'borrow') {
          input = {
            custodianId: request.requesterId,
            ...(transition === 'borrow' ? { dueDate: request.dueDate } : {}),
          };
          if (
            transition === 'borrow' &&
            text(request.dueDate) <= now().slice(0, 10)
          )
            fail('LOAN_DATE_EXPIRED');
        }
        if (
          ['return', 'transfer', 'repair'].includes(transition) &&
          asset.custodianId !== request.requesterId
        )
          fail('CUSTODY_CHANGED');
        if (transition === 'transfer') {
          transition = 'transfer' + suffix(asset);
          input = {
            departmentId: body.departmentId,
            locationId: body.locationId,
            custodianId: body.custodianId || request.requesterId,
          };
          if (!input.departmentId || !input.locationId)
            fail('TRANSFER_DESTINATION_REQUIRED');
          await this.references(input, c);
        }
        if (transition === 'repair')
          await this.openMaintenance(
            tx,
            { deviceId: asset.id, kind: 'repair', description: request.reason },
            who,
            p,
          );
        else
          await this.move(
            tx,
            'equipmentAssets',
            asset,
            transition,
            input,
            who,
            p,
          );
      }
      return this.move(
        tx,
        'equipmentRequests',
        request,
        text(body.decision),
        { resolution: body.resolution, handledById: who },
        who,
        p,
        Number(body.expectVersion),
      );
    });
  }
  async openMaintenance(
    tx: LifecycleTransaction,
    values: Row,
    who: string,
    p: Policies,
  ) {
    const c = tx.handle as DatabaseConnection;
    const asset = await this.requireRow(
      'equipmentAssets',
      text(values.deviceId),
      p,
      c,
    );
    const order = await this.create(
      tx,
      'equipmentMaintenance',
      { ...values, createdById: who, cost: 0 },
      who,
      p,
    );
    await this.move(
      tx,
      'equipmentAssets',
      asset,
      'maintain' + suffix(asset),
      {},
      who,
      p,
    );
    return order;
  }
  async createMaintenance(values: Row, who: string, p: Policies) {
    return this.runtime.transaction((tx) =>
      this.openMaintenance(tx, values, who, p),
    );
  }
  async completeMaintenance(id: string, values: Row, who: string, p: Policies) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const order = await this.requireRow('equipmentMaintenance', id, p, c);
      if (order.status !== 'open') fail('MAINTENANCE_ALREADY_COMPLETED');
      const asset = await this.requireRow(
        'equipmentAssets',
        text(order.deviceId),
        p,
        c,
      );
      const previous = text(asset.priorStatus);
      const transition =
        'restore' + previous.charAt(0).toUpperCase() + previous.slice(1);
      await this.move(tx, 'equipmentAssets', asset, transition, {}, who, p);
      return this.move(
        tx,
        'equipmentMaintenance',
        order,
        'complete',
        { resolution: values.resolution, cost: values.cost },
        who,
        p,
        Number(values.expectVersion),
      );
    });
  }
  async createStocktake(values: Row, who: string, p: Policies) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      await this.references(values, c);
      const assets = await this.repo('equipmentAssets', p, c).findMany({
        filter: (f) =>
          f.and([
            f.string('locationId').eq(text(values.locationId)),
            f.string('status').ne('scrapped'),
          ]),
        limit: 1001,
      });
      if (!assets.length) fail('NO_EQUIPMENT_AT_LOCATION');
      if (assets.length > 1000) fail('STOCKTAKE_TOO_LARGE');
      const stocktake = await this.create(
        tx,
        'equipmentStocktakes',
        { ...values, createdById: who },
        who,
        p,
      );
      const itemValues = assets.map((a) => ({
        id: randomUUID(),
        stocktakeId: idOf(stocktake),
        deviceId: a.id,
        expectedLocationId: a.locationId,
        expectedCustodianId: a.custodianId,
        expectedStatus: a.status,
        expectedVersion: a.lifecycleVersion,
        resolved: false,
      }));
      await this.repo('equipmentStocktakeItems', p, c).createMany({
        values: itemValues as [
          (typeof itemValues)[number],
          ...typeof itemValues,
        ],
      });
      return stocktake;
    });
  }
  async observe(
    stocktakeId: string,
    itemId: string,
    body: Row,
    _who: string,
    p: Policies,
  ) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const stocktake = await this.writable(
        'equipmentStocktakes',
        stocktakeId,
        { lifecycleVersion: 0 },
        p,
        c,
      );
      if (stocktake.status !== 'open') fail('STOCKTAKE_COMPLETED');
      if (Number(stocktake.lifecycleVersion) !== body.expectVersion)
        fail('STOCKTAKE_CHANGED');
      const item = await this.requireRow(
        'equipmentStocktakeItems',
        itemId,
        p,
        c,
      );
      if (item.stocktakeId !== stocktakeId)
        fail('RECORD_NOT_FOUND', 'NOT_FOUND');
      await this.references({ locationId: body.actualLocationId }, c);
      const discrepancy =
        body.actualLocationId !== item.expectedLocationId ||
        body.condition !== 'good';
      if (discrepancy && body.resolved && !text(body.note).trim())
        fail('RESOLUTION_NOTE_REQUIRED');
      const { expectVersion: _, ...values } = body;
      void _;
      await this.repo('equipmentStocktakeItems', p, c).updateOne({
        filter: { id: itemId },
        values,
      });
      await this.move(
        tx,
        'equipmentStocktakes',
        stocktake,
        'observe',
        {},
        _who,
        p,
        Number(body.expectVersion),
      );
      return this.requireRow('equipmentStocktakeItems', itemId, p, c);
    });
  }
  async completeStocktake(
    id: string,
    version: number,
    who: string,
    p: Policies,
  ) {
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const row = await this.requireRow('equipmentStocktakes', id, p, c);
      const items = await this.repo('equipmentStocktakeItems', p, c).findMany({
        filter: { stocktakeId: id },
        limit: 1001,
      });
      if (
        !items.length ||
        items.some(
          (i) =>
            !i.condition ||
            !i.actualLocationId ||
            ((i.condition !== 'good' ||
              i.actualLocationId !== i.expectedLocationId) &&
              (!i.resolved || !i.note)),
        )
      )
        fail('UNRESOLVED_STOCKTAKE_ITEMS');
      return this.move(
        tx,
        'equipmentStocktakes',
        row,
        'complete',
        {},
        who,
        p,
        version,
      );
    });
  }
  async importCsv(csv: string, who: string, p: Policies, commit = false) {
    let parsed: string[][] = [];
    try {
      parsed = readCsv(csv);
    } catch {
      fail('INVALID_CSV');
    }
    const headers = parsed[0] || [];
    const allowed = Object.keys(AssetInput.shape);
    if (
      !headers.length ||
      new Set(headers).size !== headers.length ||
      headers.some((h) => !allowed.includes(h)) ||
      !headers.includes('assetNumber')
    )
      fail('INVALID_CSV_HEADERS');
    if (parsed.length > 501) fail('CSV_LIMIT_500');
    return this.runtime.transaction(async (tx) => {
      const c = tx.handle as DatabaseConnection;
      const result: {
        row: number;
        action: string;
        assetNumber: string;
        errors: string[];
      }[] = [];
      const plans: { existing: Row | undefined; values: AssetValues }[] = [];
      const numbers = new Set<string>();
      for (let i = 1; i < parsed.length; i++) {
        const cells = parsed[i];
        const value = Object.fromEntries(
          headers.map((h, n) => [h, cells[n] || '']),
        );
        const check = AssetInput.safeParse(value);
        const errors: string[] = [];
        if (cells.length !== headers.length) errors.push('COLUMN_COUNT');
        if (!check.success)
          errors.push(
            ...check.error.issues.map((e) => text(e.path[0]) + ':INVALID'),
          );
        const number = text(value.assetNumber || '');
        if (numbers.has(number)) errors.push('DUPLICATE_ASSET_NUMBER');
        numbers.add(number);
        const existing = await this.repo('equipmentAssets', p, c).findOne({
          filter: { assetNumber: number },
        });
        if (check.success) {
          try {
            await this.references(check.data, c);
            if (
              existing &&
              (existing.locationId !== check.data.locationId ||
                existing.departmentId !== check.data.departmentId)
            )
              errors.push('USE_TRANSFER_FOR_ASSIGNMENT');
            if (existing?.status === 'scrapped') errors.push('SCRAPPED_ASSET');
          } catch {
            errors.push('INVALID_REFERENCE');
          }
          plans.push({ existing, values: check.data });
        }
        result.push({
          row: i + 1,
          action: existing ? 'update' : 'create',
          assetNumber: number,
          errors,
        });
      }
      if (commit) {
        if (result.some((r) => r.errors.length)) fail('CSV_HAS_ERRORS');
        for (const plan of plans) {
          if (plan.existing) {
            const { departmentId: _, locationId: __, ...input } = plan.values;
            void _;
            void __;
            await this.move(
              tx,
              'equipmentAssets',
              plan.existing,
              'edit' + suffix(plan.existing),
              input,
              who,
              p,
            );
          } else await this.create(tx, 'equipmentAssets', plan.values, who, p);
        }
      }
      return { rows: result, committed: commit, count: result.length };
    });
  }
  async exportCsv(q: ListValues, who: string, p: Policies) {
    const rows = await this.repo('equipmentAssets', p).findMany({
      filter: this.assetFilter(q, who),
      limit: 10001,
      sort: (s) => s.field('assetNumber').asc(),
    });
    if (rows.length > 10000) fail('EXPORT_LIMIT_10000');
    const fields = Object.keys(AssetInput.shape);
    return {
      csv: writeCsv([
        fields,
        ...rows.map((row) => fields.map((key) => row[key])),
      ]),
      count: rows.length,
    };
  }
}
