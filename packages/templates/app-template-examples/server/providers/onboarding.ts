import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, Row, FilterBuilder } from '@nocobase/db';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { LifecycleRuntime } from '@nocobase/lifecycle';
import { ApiError } from '@nocobase/app-server/router';
import {
  ONBOARDING_ACCESS,
  OnboardingSubmit,
  type OnboardingActor,
  type OnboardingInput,
  type OnboardingDetail,
} from '../../shared/onboarding.js';

export function onboardingError(
  reason: string,
  message: string,
  status:
    | 'INVALID_ARGUMENT'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'ABORTED' = 'INVALID_ARGUMENT',
  httpStatus?: 413,
) {
  return new ApiError({
    domain: 'onboarding',
    reason,
    message,
    status,
    ...(httpStatus ? { httpStatus } : {}),
  });
}
export class OnboardingService {
  constructor(
    readonly connection: DatabaseConnection,
    readonly runtime: LifecycleRuntime,
    readonly authorization: AppAuthorization,
  ) {}
  async actor(id: string): Promise<OnboardingActor> {
    const principal = { type: 'user', id };
    const authz = this.authorization.for({
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(await this.authorization.subjects.resolveFor(principal)),
      ],
    });
    const [coordinate, view] = await Promise.all(
      ['coordinate', 'view'].map((action) =>
        authz.can({ resource: ONBOARDING_ACCESS, action }),
      ),
    );
    return { id, coordinate, view };
  }
  require(actor: OnboardingActor, action?: 'coordinate' | 'view') {
    if (action ? !actor[action] : !actor.coordinate && !actor.view)
      throw onboardingError(
        'ONBOARDING_FORBIDDEN',
        'This operation requires an onboarding role.',
        'PERMISSION_DENIED',
      );
  }
  async row(id: string, actor: OnboardingActor, connection = this.connection) {
    this.require(actor);
    const row = await connection
      .repository('onboardingCases')
      .findOne({ filter: { id } });
    if (
      !row ||
      !(
        (actor.coordinate && row.coordinatorId === actor.id) ||
        (actor.view && row.status === 'submitted')
      )
    )
      throw onboardingError(
        'ONBOARDING_NOT_FOUND',
        'The onboarding case is unavailable.',
        'NOT_FOUND',
      );
    return row;
  }
  async authorizeWrite(id: string, actor: OnboardingActor) {
    this.require(actor, 'coordinate');
    const row = await this.row(id, actor);
    if (row.coordinatorId !== actor.id)
      throw onboardingError(
        'ONBOARDING_NOT_FOUND',
        'The onboarding case is unavailable.',
        'NOT_FOUND',
      );
  }
  async list(
    actor: OnboardingActor,
    options: { q: string; status?: string; page: number; pageSize: number },
  ) {
    this.require(actor);
    const filter = (f: FilterBuilder) =>
      f.and([
        f.or([
          ...(actor.coordinate ? [f.string('coordinatorId').eq(actor.id)] : []),
          ...(actor.view ? [f.string('status').eq('submitted')] : []),
        ]),
        ...(options.q
          ? [
              f.or([
                f.string('fullName').includes(options.q),
                f.string('workEmail').includes(options.q),
              ]),
            ]
          : []),
        ...(options.status ? [f.string('status').eq(options.status)] : []),
      ]);
    const repo = this.connection.repository('onboardingCases');
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
  async candidates(actor: OnboardingActor, q: string) {
    this.require(actor, 'coordinate');
    const rows = await this.connection
      .repository('onboardingDepartments')
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
    return rows.map((row) => ({ id: scalar(row.id), name: scalar(row.name) }));
  }
  async detail(id: string, actor: OnboardingActor): Promise<OnboardingDetail> {
    const row = await this.row(id, actor);
    const [documents, department, employee, view] = await Promise.all([
      this.connection.repository('onboardingDocuments').findMany({
        filter: { caseId: id },
        sort: (s) => s.field('position').asc(),
      }),
      row.departmentId
        ? this.connection
            .repository('onboardingDepartments')
            .findOne({ filter: { id: scalar(row.departmentId) } })
        : null,
      row.employeeId
        ? this.connection
            .repository('onboardingEmployees')
            .findOne({ filter: { caseId: id } })
        : null,
      this.runtime.view('onboarding', id, { id: actor.id }),
    ]);
    const editable =
      actor.coordinate &&
      row.coordinatorId === actor.id &&
      row.status === 'draft';
    return {
      record: serializeRecord(row),
      departmentName: department ? scalar(department.name) : null,
      documents: documents.map(serializeDocument),
      employee: employee
        ? {
            id: scalar(employee.id),
            caseId: scalar(employee.caseId),
            fullName: scalar(employee.fullName),
            workEmail: scalar(employee.workEmail),
            departmentId: scalar(employee.departmentId),
            jobTitle: scalar(employee.jobTitle),
            startDate: scalar(employee.startDate),
          }
        : null,
      actions: { edit: editable, submit: editable },
      history: view.history.transitions.map((h) => ({
        id: scalar(h.id),
        transition: h.transition,
        from: h.from,
        to: h.to,
        actorId: h.actorId,
        at: h.at,
      })),
    };
  }
  private async validateDepartment(
    id: string | null,
    actor: OnboardingActor,
    tx: DatabaseConnection,
  ) {
    if (!id) return;
    const row = await tx
      .repository('onboardingDepartments')
      .findOne({ filter: { id } });
    if (
      !row ||
      !row.active ||
      (row.allowedUserId !== null && row.allowedUserId !== actor.id)
    )
      throw onboardingError(
        'DEPARTMENT_FORBIDDEN',
        'The selected department is inactive or unavailable.',
        'PERMISSION_DENIED',
      );
  }
  async save(
    actor: OnboardingActor,
    input: OnboardingInput,
    id?: string,
    version?: number,
    connection = this.connection,
  ) {
    this.require(actor, 'coordinate');
    return connection.transaction(async (tx) => {
      const current = id ? await this.row(id, actor, tx) : undefined;
      if (current && current.coordinatorId !== actor.id)
        throw onboardingError(
          'ONBOARDING_NOT_FOUND',
          'The onboarding case is unavailable.',
          'NOT_FOUND',
        );
      if (current && current.status !== 'draft')
        throw onboardingError(
          'CASE_CHANGED',
          'The case changed. Reload before trying again.',
          'ABORTED',
        );
      await this.validateDepartment(input.departmentId, actor, tx);
      const existing = id
        ? await tx
            .repository('onboardingDocuments')
            .findMany({ filter: { caseId: id } })
        : [];
      const ids = input.documents.flatMap((d) => (d.id ? [d.id] : []));
      if (
        new Set(ids).size !== ids.length ||
        input.documents.some(
          (d) => d.id && !existing.some((e) => e.id === d.id),
        )
      )
        throw onboardingError(
          'FOREIGN_DOCUMENT',
          'A document does not belong to this case.',
          'PERMISSION_DENIED',
        );
      const caseId = id ?? randomUUID();
      const { documents, ...values } = input;
      if (current) {
        const updated = await tx.repository('onboardingCases').updateMany({
          filter: {
            id,
            coordinatorId: actor.id,
            status: 'draft',
            lifecycleVersion: version,
          },
          values: { ...values, lifecycleVersion: { increment: 1 } },
        });
        if (updated.updatedCount !== 1)
          throw onboardingError(
            'CASE_CHANGED',
            'The case changed. Reload before trying again.',
            'ABORTED',
          );
        await tx
          .repository('onboardingDocuments')
          .deleteMany({ filter: { caseId } });
      } else
        await this.runtime.create(
          'onboarding',
          {
            id: caseId,
            coordinatorId: actor.id,
            ...values,
            employeeId: null,
            createdAt: new Date().toISOString(),
          },
          { actor: { id: actor.id }, transaction: tx },
        );
      for (const [position, document] of documents.entries())
        await tx.repository('onboardingDocuments').createOne({
          values: {
            ...document,
            id: document.id ?? randomUUID(),
            caseId,
            position,
          },
        });
      return { id: caseId };
    });
  }
  async submit(
    id: string,
    actor: OnboardingActor,
    version: number,
    key: string,
    connection = this.connection,
  ) {
    this.require(actor, 'coordinate');
    let email: string | undefined;
    try {
      return await connection.transaction(async (tx) => {
        const row = await this.row(id, actor, tx);
        if (row.coordinatorId !== actor.id)
          throw onboardingError(
            'ONBOARDING_NOT_FOUND',
            'The onboarding case is unavailable.',
            'NOT_FOUND',
          );
        if (row.status !== 'draft')
          throw onboardingError(
            'CASE_CHANGED',
            'The case changed. Reload before trying again.',
            'ABORTED',
          );
        const documents = await tx
          .repository('onboardingDocuments')
          .findMany({ filter: { caseId: id } });
        const {
          id: _caseId,
          coordinatorId: _coordinatorId,
          status: _status,
          lifecycleVersion: _version,
          employeeId: _employeeId,
          createdAt: _createdAt,
          ...fields
        } = serializeRecord(row);
        const parsed = OnboardingSubmit.safeParse({
          ...fields,
          documents: documents.map(serializeDocument),
        });
        if (!parsed.success)
          throw onboardingError(
            'INCOMPLETE_CASE',
            'Complete all required fields, employment rules and documents before submitting.',
            'INVALID_ARGUMENT',
          );
        await this.validateDepartment(parsed.data.departmentId, actor, tx);
        // Native lifecycle version checks serialize edits/submissions of this case.
        await this.runtime.fire('onboarding', id, 'submit', {
          actor: { id: actor.id },
          manual: true,
          expect: { version },
          requestId: key,
          transaction: tx,
        });
        email = parsed.data.workEmail;
        if (
          await tx
            .repository('onboardingEmployees')
            .findOne({ filter: { workEmail: email } })
        )
          throw onboardingError(
            'EMPLOYEE_EXISTS',
            'An employee already uses this work email.',
            'ABORTED',
          );
        const employeeId = randomUUID();
        const { documents: _documents, ...employee } = parsed.data;
        await tx.repository('onboardingEmployees').createOne({
          values: {
            ...employee,
            id: employeeId,
            caseId: id,
            createdAt: new Date().toISOString(),
          },
        });
        await tx
          .repository('onboardingCases')
          .updateOne({ filter: { id }, values: { employeeId } });
        return { id };
      });
    } catch (error) {
      // A different case can win the unique email constraint after our check.
      // Read only after the failed transaction/savepoint has rolled back.
      if (!(error instanceof ApiError) && email) {
        const existing = await connection
          .repository('onboardingEmployees')
          .findOne({ filter: { workEmail: email } });
        if (existing && existing.caseId !== id)
          throw onboardingError(
            'EMPLOYEE_EXISTS',
            'An employee already uses this work email.',
            'ABORTED',
          );
      }
      throw error;
    }
  }
}
function scalar(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
    ? String(value)
    : '';
}
function serializeRecord(row: Row): OnboardingDetail['record'] {
  return {
    id: scalar(row.id),
    fullName: scalar(row.fullName),
    workEmail: scalar(row.workEmail),
    nationality: scalar(row.nationality),
    departmentId: row.departmentId as string | null,
    jobTitle: scalar(row.jobTitle),
    employmentType: row.employmentType as OnboardingInput['employmentType'],
    startDate: scalar(row.startDate),
    probationMonths:
      row.probationMonths == null ? null : Number(row.probationMonths),
    contractEndDate: scalar(row.contractEndDate),
    coordinatorId: scalar(row.coordinatorId),
    status: row.status as 'draft' | 'submitted',
    lifecycleVersion: Number(row.lifecycleVersion),
    employeeId: row.employeeId as string | null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : scalar(row.createdAt),
  };
}
function serializeDocument(row: Row): OnboardingDetail['documents'][number] {
  return {
    id: scalar(row.id),
    kind: row.kind as OnboardingInput['documents'][number]['kind'],
    title: scalar(row.title),
    referenceNo: scalar(row.referenceNo),
  };
}
