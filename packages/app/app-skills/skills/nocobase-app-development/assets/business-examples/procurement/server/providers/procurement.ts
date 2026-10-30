import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, Row } from '@nocobase/db';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { LifecycleRuntime } from '@nocobase/lifecycle';
import { ApiError } from '@nocobase/app-server/router';
import {
  amount,
  minorUnits,
  PROCUREMENT_ACCESS,
  type ProcurementActor,
  type ProcurementInput,
  type ProcurementDetail,
} from '../../shared/procurement.js';

export function procurementError(
  reason: string,
  message: string,
  status:
    | 'INVALID_ARGUMENT'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'ABORTED' = 'INVALID_ARGUMENT',
) {
  return new ApiError({
    domain: 'procurement',
    reason,
    message,
    status,
  });
}

/** All repositories used by a write come from its transaction connection. */
export class ProcurementService {
  constructor(
    readonly connection: DatabaseConnection,
    readonly runtime: LifecycleRuntime,
    readonly authorization: AppAuthorization,
  ) {}

  async actor(id: string): Promise<ProcurementActor> {
    const principal = { type: 'user', id };
    const authz = this.authorization.for({
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(await this.authorization.subjects.resolveFor(principal)),
      ],
    });
    const [request, review] = await Promise.all(
      ['request', 'review'].map((action) =>
        authz.can({ resource: PROCUREMENT_ACCESS, action }),
      ),
    );
    return { id, request, review };
  }
  require(actor: ProcurementActor, action?: 'request' | 'review') {
    if (action ? !actor[action] : !actor.request && !actor.review)
      throw procurementError(
        'PROCUREMENT_FORBIDDEN',
        'This operation requires a procurement role.',
        'PERMISSION_DENIED',
      );
  }
  private visible(row: Row, actor: ProcurementActor) {
    return (
      (actor.request && row.applicantId === actor.id) ||
      (actor.review &&
        row.reviewerId === actor.id &&
        row.applicantId !== actor.id &&
        row.status !== 'draft')
    );
  }
  async row(id: string, actor: ProcurementActor, connection = this.connection) {
    this.require(actor);
    const row = await connection
      .repository('procurementRequests')
      .findOne({ filter: { id } });
    if (!row || !this.visible(row, actor))
      throw procurementError(
        'PROCUREMENT_NOT_FOUND',
        'The request is unavailable.',
        'NOT_FOUND',
      );
    return row;
  }
  async list(
    actor: ProcurementActor,
    options: { q: string; status?: string; page: number; pageSize: number },
  ) {
    this.require(actor);
    const filter = (f: import('@nocobase/db').FilterBuilder) =>
      f.and([
        f.or([
          ...(actor.request ? [f.string('applicantId').eq(actor.id)] : []),
          ...(actor.review
            ? [
                f.and([
                  f.string('reviewerId').eq(actor.id),
                  f.string('applicantId').ne(actor.id),
                  f.string('status').ne('draft'),
                ]),
              ]
            : []),
        ]),
        ...(options.q ? [f.string('title').includes(options.q)] : []),
        ...(options.status ? [f.string('status').eq(options.status)] : []),
      ]);
    const repo = this.connection.repository('procurementRequests');
    const [rows, total] = await Promise.all([
      repo.findMany({
        filter,
        sort: (s) => s.field('createdAt').desc(),
        limit: options.pageSize,
        offset: (options.page - 1) * options.pageSize,
      }),
      repo.count({ filter }),
    ]);
    return {
      data: rows.map(serializeRecord),
      meta: { total, page: options.page, pageSize: options.pageSize },
    };
  }
  async candidates(
    actor: ProcurementActor,
    kind: 'suppliers' | 'materials' | 'reviewers',
    q: string,
    active = true,
  ) {
    this.require(actor, 'request');
    if (kind === 'reviewers') {
      const eligible: { id: string; name: string }[] = [];
      let offset = 0;
      // Filter permissions before applying the 100-result limit so reviewers
      // remain reachable after any number of ordinary users.
      while (eligible.length < 100) {
        const users = await this.connection.repository('user').findMany({
          filter: (f) =>
            f.and([
              f.string('id').ne(actor.id),
              ...(q ? [f.string('name').includes(q)] : []),
            ]),
          sort: (s) => s.field('id').asc(),
          limit: 100,
          offset,
        });
        const matches = await Promise.all(
          users.map(async (u) =>
            (await this.actor(scalar(u.id))).review
              ? { id: scalar(u.id), name: scalar(u.name) }
              : null,
          ),
        );
        eligible.push(...matches.filter((u) => u !== null));
        if (users.length < 100) break;
        offset += users.length;
      }
      return eligible.slice(0, 100);
    }
    // Inactive entries are never selectable, even if a caller asks for them.
    if (!active) return [];
    const rows = await this.connection
      .repository(
        kind === 'suppliers' ? 'procurementSuppliers' : 'procurementMaterials',
      )
      .findMany({
        filter: (f) =>
          f.and([
            f.boolean('active').isTrue(),
            f.or([
              f.string('allowedUserId').eq(null),
              f.string('allowedUserId').eq(actor.id),
            ]),
            ...(q ? [f.string('name').includes(q)] : []),
          ]),
        sort: (s) => s.field('name').asc(),
        limit: 100,
      });
    return rows.map((r) => ({
      id: scalar(r.id),
      name: scalar(r.name),
      ...(kind === 'materials'
        ? { unitPrice: (Number(r.unitPriceMinor) / 100).toFixed(2) }
        : {}),
    }));
  }
  async detail(
    id: string,
    actor: ProcurementActor,
  ): Promise<ProcurementDetail> {
    const row = await this.row(id, actor);
    const lines = await this.connection
      .repository('procurementLines')
      .findMany({
        filter: { requestId: id },
        sort: (s) => s.field('position').asc(),
      });
    const view = await this.runtime.view('procurement', id, { id: actor.id });
    const editable =
      actor.request &&
      row.applicantId === actor.id &&
      ['draft', 'rejected'].includes(scalar(row.status));
    const decidable =
      actor.review &&
      row.reviewerId === actor.id &&
      row.applicantId !== actor.id &&
      row.status === 'submitted';
    const supplier = row.supplierId
      ? await this.connection
          .repository('procurementSuppliers')
          .findOne({ filter: { id: scalar(row.supplierId) } })
      : null;
    const userIds = [
      ...new Set([
        ...view.history.transitions.map((h) => h.actorId),
        ...(row.reviewerId ? [scalar(row.reviewerId)] : []),
      ]),
    ];
    const users = userIds.length
      ? await this.connection.repository('user').findMany({
          filter: (f) => f.or(userIds.map((id) => f.string('id').eq(id))),
        })
      : [];
    const names = new Map(users.map((u) => [scalar(u.id), scalar(u.name)]));
    const materialIds = [...new Set(lines.map((l) => scalar(l.materialId)))];
    const materials = materialIds.length
      ? await this.connection.repository('procurementMaterials').findMany({
          filter: (f) => f.or(materialIds.map((id) => f.string('id').eq(id))),
        })
      : [];
    const catalog = new Map(
      materials.map((m) => [scalar(m.id), Number(m.unitPriceMinor)]),
    );
    return {
      supplierName: supplier ? scalar(supplier.name) : null,
      reviewerName: names.get(scalar(row.reviewerId)) ?? null,
      record: serializeRecord(row),
      lines: lines.map((l) => ({
        id: scalar(l.id),
        materialId: scalar(l.materialId),
        materialName: scalar(l.materialName),
        quantity: Number(l.quantity),
        unitPriceMinor: Number(l.unitPriceMinor),
        unitPrice: (Number(l.unitPriceMinor) / 100).toFixed(2),
        amountMinor: Number(l.amountMinor),
        currentCatalogPriceMinor: catalog.get(scalar(l.materialId)) ?? null,
      })),
      actions: {
        edit: editable,
        submit: editable,
        approve: decidable,
        reject: decidable,
      },
      history: view.history.transitions.map((h) => ({
        id: scalar(h.id),
        transition: h.transition,
        from: h.from,
        to: h.to,
        actorId: h.actorId,
        actorName: names.get(h.actorId) ?? null,
        at: h.at,
      })),
    };
  }
  private async validate(
    input: ProcurementInput,
    actor: ProcurementActor,
    connection: DatabaseConnection,
    submitting = false,
    eligibleReviewer = true,
  ) {
    let total: number;
    try {
      total = amount(input.lines);
    } catch {
      throw procurementError(
        'INVALID_AMOUNT',
        'The total exceeds the supported amount.',
      );
    }
    if (total !== input.totalMinor)
      throw procurementError(
        'AMOUNT_MISMATCH',
        'The total must match the line amounts.',
      );
    const ids = input.lines.flatMap((l) => (l.id ? [l.id] : []));
    if (new Set(ids).size !== ids.length)
      throw procurementError('INVALID_LINE', 'A line may appear only once.');
    if (
      submitting &&
      (!input.title ||
        !input.supplierId ||
        !input.reviewerId ||
        !input.lines.length)
    )
      throw procurementError(
        'INCOMPLETE_REQUEST',
        'Add a title, supplier, reviewer and at least one line.',
      );
    const checkReference = async (collection: string, id: string) => {
      const row = await connection
        .repository(collection)
        .findOne({ filter: { id } });
      if (
        !row ||
        !row.active ||
        (row.allowedUserId !== null && row.allowedUserId !== actor.id)
      )
        throw procurementError(
          'REFERENCE_FORBIDDEN',
          'The selected reference is inactive or unavailable.',
          'PERMISSION_DENIED',
        );
      return row;
    };
    if (input.supplierId)
      await checkReference('procurementSuppliers', input.supplierId);
    if (input.reviewerId && !eligibleReviewer)
      throw procurementError(
        'INVALID_REVIEWER',
        'Choose another user with procurement review permission.',
      );
    const lines = [];
    for (const [position, line] of input.lines.entries()) {
      const material = await checkReference(
        'procurementMaterials',
        line.materialId,
      );
      // Save the applicant's quote; the catalog is a live review reference.
      const unitPriceMinor = minorUnits(line.unitPrice);
      lines.push({
        id: line.id ?? randomUUID(),
        materialId: line.materialId,
        materialName: scalar(material.name),
        quantity: line.quantity,
        unitPriceMinor,
        amountMinor: line.quantity * unitPriceMinor,
        position,
      });
    }
    return { total, lines };
  }
  async save(
    actor: ProcurementActor,
    input: ProcurementInput,
    id?: string,
    version?: number,
    connection = this.connection,
    eligibleReviewer = true,
  ) {
    this.require(actor, 'request');
    return connection.transaction(async (tx) => {
      const current = id ? await this.row(id, actor, tx) : undefined;
      if (
        current &&
        (current.applicantId !== actor.id ||
          !['draft', 'rejected'].includes(scalar(current.status)))
      )
        throw procurementError(
          'REQUEST_LOCKED',
          'Only your draft or rejected request can be edited.',
          'PERMISSION_DENIED',
        );
      const validated = await this.validate(
        input,
        actor,
        tx,
        false,
        eligibleReviewer,
      );
      const requestId = id ?? randomUUID();
      const existing = id
        ? await tx
            .repository('procurementLines')
            .findMany({ filter: { requestId: id } })
        : [];
      if (input.lines.some((l) => l.id && !existing.some((e) => e.id === l.id)))
        throw procurementError(
          'FOREIGN_LINE',
          'A line does not belong to this request.',
          'PERMISSION_DENIED',
        );
      const values = {
        title: input.title,
        supplierId: input.supplierId,
        reviewerId: input.reviewerId,
        totalMinor: validated.total,
      };
      if (current) {
        const changed = await tx.repository('procurementRequests').updateMany({
          filter: {
            id,
            applicantId: actor.id,
            status: scalar(current.status),
            lifecycleVersion: version,
          },
          values: { ...values, lifecycleVersion: { increment: 1 } },
        });
        if (changed.updatedCount !== 1)
          throw procurementError(
            'REQUEST_CHANGED',
            'The request changed. Reload before trying again.',
            'ABORTED',
          );
        await tx
          .repository('procurementLines')
          .deleteMany({ filter: { requestId } });
      } else {
        await this.runtime.create(
          'procurement',
          {
            id: requestId,
            applicantId: actor.id,
            ...values,
            createdAt: new Date().toISOString(),
          },
          { actor: { id: actor.id }, transaction: tx },
        );
      }
      for (const line of validated.lines)
        await tx
          .repository('procurementLines')
          .createOne({ values: { ...line, requestId } });
      return { id: requestId };
    });
  }
  async reviewerEligible(id: string | null, actor: ProcurementActor) {
    return !id || (id !== actor.id && (await this.actor(id)).review);
  }
  async fire(
    id: string,
    actor: ProcurementActor,
    transition: 'submit' | 'approve' | 'reject',
    version: number,
    requestId: string,
  ) {
    this.require(actor, transition === 'submit' ? 'request' : 'review');
    const before = await this.row(id, actor);
    const eligibleReviewer = await this.reviewerEligible(
      before.reviewerId as string | null,
      actor,
    );
    return this.connection.transaction(async (tx) => {
      const row = await this.row(id, actor, tx);
      if (transition === 'submit') {
        if (row.applicantId !== actor.id)
          throw procurementError(
            'PROCUREMENT_FORBIDDEN',
            'Only the applicant can submit.',
            'PERMISSION_DENIED',
          );
        const lines = await tx
          .repository('procurementLines')
          .findMany({ filter: { requestId: id } });
        await this.validate(
          {
            title: scalar(row.title),
            supplierId: row.supplierId as string | null,
            reviewerId: row.reviewerId as string | null,
            totalMinor: Number(row.totalMinor),
            lines: lines.map((l) => ({
              id: scalar(l.id),
              materialId: scalar(l.materialId),
              quantity: Number(l.quantity),
              unitPrice: (Number(l.unitPriceMinor) / 100).toFixed(2),
            })),
          },
          actor,
          tx,
          true,
          eligibleReviewer,
        );
      } else if (row.reviewerId !== actor.id || row.applicantId === actor.id)
        throw procurementError(
          'PROCUREMENT_FORBIDDEN',
          'Only the designated reviewer can decide.',
          'PERMISSION_DENIED',
        );
      const result = await this.runtime.fire('procurement', id, transition, {
        actor: { id: actor.id },
        manual: true,
        expect: { version },
        requestId,
        transaction: tx,
      });
      return { id, replayed: result.replayed === true };
    });
  }
}

function serializeRecord(row: Row): ProcurementDetail['record'] {
  return {
    id: scalar(row.id),
    title: scalar(row.title),
    applicantId: scalar(row.applicantId),
    reviewerId: row.reviewerId as string | null,
    supplierId: row.supplierId as string | null,
    status: row.status as ProcurementDetail['record']['status'],
    lifecycleVersion: Number(row.lifecycleVersion),
    totalMinor: Number(row.totalMinor),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : scalar(row.createdAt),
  };
}

function scalar(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
    ? String(value)
    : '';
}
