import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type ApiErrorStatus,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { Hono } from 'hono';

import {
  emptyDataRequest,
  type DataRequestForm,
} from '../../shared/data-request.js';
import { OFFICE_FLOWS_ROUTES } from '../../shared/routes.js';
import { OfficeFlowsError } from '../services/office-flows.js';
import type { Plain } from '../services/store.js';
import { officeFlowsServiceToken } from '../tokens.js';
import {
  ActAsPageQuery,
  ActAsQuery,
  Created,
  CreateExtractionInput,
  DataRequestFormInput,
  DispatchingTaskParams,
  ExtractionParams,
  ExtractionValuesInput,
  FireInput,
  IncomingParams,
  IncomingValuesInput,
  ManagementRowInput,
  OfficeConfig,
  OfficeDetail,
  OfficeRecord,
  PageMeta,
  PageQuery,
  RequestParams,
  RowInput,
  RowParams,
  ScheduleRun,
  TaskParams,
  TaskValuesInput,
} from './schemas.js';

/** The namespace of every route this plugin owns, and the domain of its errors. */
export const OFFICE_FLOWS_DOMAIN: string = OFFICE_FLOWS_ROUTES;

/** Every route below starts here; the client reads the same constant. */
const BASE = `/${OFFICE_FLOWS_ROUTES}`;

/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
const tags = ['OfficeFlowsExample'];

const SERVICE_STATUS: Record<OfficeFlowsError['code'], ApiErrorStatus> = {
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'PERMISSION_DENIED',
  INVALID: 'INVALID_ARGUMENT',
  LOCKED: 'FAILED_PRECONDITION',
  CONFLICT: 'ABORTED',
};

/**
 * The service's refusals and the lifecycles', as the standard error body.
 * `inputField` names where a transition's input sits in the request body.
 */
function toApiError(error: unknown, inputField?: string): unknown {
  if (error instanceof LifecycleError) {
    const fields = lifecycleErrorFields(
      error,
      inputField ? { inputField } : {},
    );
    // A broken definition is the server's fault: the application answers 500.
    return fields
      ? new ApiError({ ...fields, domain: OFFICE_FLOWS_DOMAIN })
      : error;
  }
  if (error instanceof OfficeFlowsError)
    return new ApiError({
      status: SERVICE_STATUS[error.code],
      reason: error.reason,
      domain: OFFICE_FLOWS_DOMAIN,
      message: error.message,
      ...(error.fields.length
        ? {
            fieldViolations: error.fields.map((field) => ({
              field,
              description: error.message,
            })),
          }
        : {}),
    });
  return error;
}

/**
 * A value as a response carries it: every id — `id` and each `…Id` — a
 * string, since the collections' integer keys would otherwise reach a
 * client as numbers.
 */
function outward(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(outward);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [
      key,
      (key === 'id' || key.endsWith('Id')) && typeof field === 'number'
        ? String(field)
        : outward(field),
    ]),
  );
}

const data = (value: unknown): { readonly data: Plain } => ({
  data: outward(value) as Plain,
});

function page(
  result: { readonly records: readonly Plain[]; readonly total: number },
  query: { readonly page: number; readonly pageSize: number },
) {
  return {
    data: outward(result.records) as Plain[],
    meta: { page: query.page, pageSize: query.pageSize, total: result.total },
  };
}

/** A new request's form: a field the request leaves out starts empty. */
function form(values: Partial<DataRequestForm>): DataRequestForm {
  return { ...emptyDataRequest(), ...values };
}

const noContent = emptyResponse();
const unauthorized = apiErrorResponse(401);
const internal = apiErrorResponse(500);
const notFound = apiErrorResponse(404, 'No such record (`RECORD_NOT_FOUND`).');
const fireRefusals = {
  400: apiErrorResponse(
    400,
    'The state does not allow it, or the record is not complete enough (`INVALID_STATE`); every guard that refused waits for the record to change (`GUARD_REJECTED`, status `FAILED_PRECONDITION`), such as an open extraction task; its input is invalid (`INVALID_INPUT`) or the transition is unknown (`UNKNOWN_TRANSITION`).',
  ),
  403: apiErrorResponse(
    403,
    'A guard refused the persona while others may still act (`GUARD_REJECTED`), such as a clerk who has already countersigned.',
  ),
  409: apiErrorResponse(409, 'A concurrent change won (`CONFLICT`).'),
};
const editRefusals = {
  400: apiErrorResponse(
    400,
    'The record cannot be edited at this step (`RECORD_LOCKED`).',
  ),
  403: apiErrorResponse(
    403,
    'The persona cannot edit it (`EDIT_NOT_ALLOWED`).',
  ),
  409: apiErrorResponse(
    409,
    'Concurrent changes kept winning; the edit was reapplied and gave up (`RECORD_CHANGED`).',
  ),
};

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthEnv>();
    const authentication = container.resolve(authenticationToken);
    const service = container.resolve(officeFlowsServiceToken);
    const fire = async (work: () => Promise<void>): Promise<void> => {
      try {
        await work();
      } catch (error) {
        // The transition's input sits under `input` in these bodies.
        throw toApiError(error, 'input');
      }
    };

    router.use(`${BASE}/*`, authentication.required());
    router.onError((error, context) =>
      apiErrorHandler(toApiError(error), context),
    );

    // ── Reference data and the persona's reminders ──────────────────────

    router.get(
      `${BASE}/config`,
      describeRoute({
        tags,
        summary: 'Get the reference data',
        operationId: 'officeFlowsExampleGetConfig',
        description:
          'The cast and its roles, the departments, the management groups and the holidays.',
        responses: {
          200: dataResponse(OfficeConfig),
          401: unauthorized,
          500: internal,
        },
      }),
      async (context) => context.json(data(await service.config())),
    );
    router.get(
      `${BASE}/notices`,
      describeRoute({
        tags,
        summary: 'List the persona’s reminders',
        operationId: 'officeFlowsExampleListNotices',
        responses: {
          200: listResponse(OfficeRecord, PageMeta),
          401: unauthorized,
          500: internal,
        },
      }),
      apiValidator('query', ActAsPageQuery),
      async (context) => {
        const query = context.req.valid('query');
        return context.json(
          page(await service.notices(query.actAs, query), query),
        );
      },
    );
    router.post(
      `${BASE}/runSchedule`,
      describeRoute({
        tags,
        summary: 'Create the extraction tasks that are due',
        operationId: 'officeFlowsExampleRunSchedule',
        description:
          'The daily sweep, now: every request in acceptance gets the extraction tasks due by today. Safe to repeat.',
        responses: {
          200: dataResponse(ScheduleRun),
          401: unauthorized,
          500: internal,
        },
      }),
      async (context) =>
        context.json({ data: { created: await service.runSchedule() } }),
    );

    // ── Data usage requests ─────────────────────────────────────────────

    router.get(
      `${BASE}/dataRequests`,
      describeRoute({
        tags,
        summary: 'List data usage requests',
        operationId: 'officeFlowsExampleListDataRequests',
        responses: {
          200: listResponse(OfficeRecord, PageMeta),
          401: unauthorized,
          500: internal,
        },
      }),
      apiValidator('query', PageQuery),
      async (context) => {
        const query = context.req.valid('query');
        return context.json(page(await service.listDataRequests(query), query));
      },
    );
    router.post(
      `${BASE}/dataRequests`,
      describeRoute({
        tags,
        summary: 'Draft a data usage request',
        operationId: 'officeFlowsExampleCreateDataRequest',
        responses: {
          201: dataResponse(OfficeRecord, 'The request, in `draft`.'),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Only the applicant drafts one (`APPLICANT_ONLY`).',
          ),
          500: internal,
        },
      }),
      apiValidator('query', ActAsQuery),
      apiValidator('json', DataRequestFormInput),
      async (context) => {
        const { actAs } = context.req.valid('query');
        const values = context.req.valid('json');
        return context.json(
          data(await service.createDataRequest(form(values.form), actAs)),
          201,
        );
      },
    );
    router.get(
      `${BASE}/dataRequests/:requestId`,
      describeRoute({
        tags,
        summary: 'Get a data usage request',
        operationId: 'officeFlowsExampleGetDataRequest',
        responses: {
          200: dataResponse(OfficeDetail),
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', RequestParams),
      apiValidator('query', ActAsQuery),
      async (context) => {
        const { requestId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        return context.json(
          data(await service.dataRequestDetail(requestId, actAs)),
        );
      },
    );
    router.patch(
      `${BASE}/dataRequests/:requestId`,
      describeRoute({
        tags,
        summary: 'Edit a draft data usage request',
        operationId: 'officeFlowsExampleUpdateDataRequest',
        description:
          'Changes only the form fields sent; the others keep their values. Answers the choices hide are cleared, as on creation.',
        responses: {
          200: dataResponse(OfficeDetail, 'The request as edited.'),
          ...editRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', RequestParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', DataRequestFormInput),
      async (context) => {
        const { requestId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const values = context.req.valid('json');
        // Only the fields sent: the schema adds none, so the rest stay as stored.
        await service.updateDataRequest(requestId, values.form, actAs);
        return context.json(
          data(await service.dataRequestDetail(requestId, actAs)),
        );
      },
    );
    router.post(
      `${BASE}/dataRequests/:requestId/fire`,
      describeRoute({
        tags,
        summary: 'Fire a transition on a data usage request',
        operationId: 'officeFlowsExampleFireDataRequestTransition',
        responses: {
          204: noContent,
          ...fireRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', RequestParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', FireInput),
      async (context) => {
        const { requestId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { transition, input } = context.req.valid('json');
        await fire(() =>
          service.fire(
            'dataRequests',
            requestId,
            transition,
            input,
            actAs,
            true,
          ),
        );
        return context.body(null, 204);
      },
    );
    router.post(
      `${BASE}/dataRequests/:requestId/extractions`,
      describeRoute({
        tags,
        summary: 'Create an extraction task by hand',
        operationId: 'officeFlowsExampleCreateExtraction',
        description:
          'Only the acceptor, while the request is in acceptance; the task takes the next number.',
        responses: {
          201: dataResponse(OfficeRecord, 'The extraction task, `pending`.'),
          400: apiErrorResponse(
            400,
            'No topic or no valid first date (`EXTRACTION_FIELDS_REQUIRED`, with `fieldViolations`).',
          ),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Not the acceptor, or not in acceptance (`ACCEPTOR_ONLY`).',
          ),
          404: notFound,
          409: apiErrorResponse(
            409,
            'The request left acceptance meanwhile (`REQUEST_LEFT_ACCEPTANCE`).',
          ),
          500: internal,
        },
      }),
      apiValidator('param', RequestParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', CreateExtractionInput),
      async (context) => {
        const { requestId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const values = context.req.valid('json');
        return context.json(
          data(await service.createManualExtraction(requestId, values, actAs)),
          201,
        );
      },
    );

    // ── Extraction tasks ────────────────────────────────────────────────

    router.get(
      `${BASE}/extractions/:extractionId`,
      describeRoute({
        tags,
        summary: 'Get an extraction task',
        operationId: 'officeFlowsExampleGetExtraction',
        responses: {
          200: dataResponse(OfficeDetail),
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', ExtractionParams),
      apiValidator('query', ActAsQuery),
      async (context) => {
        const { extractionId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        return context.json(
          data(await service.extractionDetail(extractionId, actAs)),
        );
      },
    );
    router.patch(
      `${BASE}/extractions/:extractionId`,
      describeRoute({
        tags,
        summary: 'Edit a pending extraction task',
        operationId: 'officeFlowsExampleUpdateExtraction',
        responses: {
          200: dataResponse(OfficeDetail, 'The task as edited.'),
          ...editRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', ExtractionParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', ExtractionValuesInput),
      async (context) => {
        const { extractionId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { values } = context.req.valid('json');
        await service.updateExtraction(extractionId, values, actAs);
        return context.json(
          data(await service.extractionDetail(extractionId, actAs)),
        );
      },
    );
    router.post(
      `${BASE}/extractions/:extractionId/fire`,
      describeRoute({
        tags,
        summary: 'Fire a transition on an extraction task',
        operationId: 'officeFlowsExampleFireExtractionTransition',
        responses: {
          204: noContent,
          ...fireRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', ExtractionParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', FireInput),
      async (context) => {
        const { extractionId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { transition, input } = context.req.valid('json');
        await fire(() =>
          service.fire(
            'extractions',
            extractionId,
            transition,
            input,
            actAs,
            true,
          ),
        );
        return context.body(null, 204);
      },
    );

    // ── Incoming documents ──────────────────────────────────────────────

    router.get(
      `${BASE}/incoming`,
      describeRoute({
        tags,
        summary: 'List incoming documents',
        operationId: 'officeFlowsExampleListIncoming',
        responses: {
          200: listResponse(OfficeRecord, PageMeta),
          401: unauthorized,
          500: internal,
        },
      }),
      apiValidator('query', PageQuery),
      async (context) => {
        const query = context.req.valid('query');
        return context.json(page(await service.listIncoming(query), query));
      },
    );
    router.post(
      `${BASE}/incoming`,
      describeRoute({
        tags,
        summary: 'Record an incoming document',
        operationId: 'officeFlowsExampleCreateIncoming',
        responses: {
          201: dataResponse(OfficeRecord, 'The document, in `draft`.'),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Only the office registrar records one (`REGISTRAR_ONLY`).',
          ),
          500: internal,
        },
      }),
      apiValidator('query', ActAsQuery),
      apiValidator('json', IncomingValuesInput),
      async (context) => {
        const { actAs } = context.req.valid('query');
        const { values } = context.req.valid('json');
        return context.json(
          data(await service.createIncoming(values, actAs)),
          201,
        );
      },
    );
    router.get(
      `${BASE}/incoming/:incomingId`,
      describeRoute({
        tags,
        summary: 'Get an incoming document',
        operationId: 'officeFlowsExampleGetIncoming',
        responses: {
          200: dataResponse(OfficeDetail),
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', IncomingParams),
      apiValidator('query', ActAsQuery),
      async (context) => {
        const { incomingId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        return context.json(
          data(await service.incomingDetail(incomingId, actAs)),
        );
      },
    );
    router.patch(
      `${BASE}/incoming/:incomingId`,
      describeRoute({
        tags,
        summary: 'Edit a draft incoming document',
        operationId: 'officeFlowsExampleUpdateIncoming',
        responses: {
          200: dataResponse(OfficeDetail, 'The document as edited.'),
          ...editRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', IncomingParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', IncomingValuesInput),
      async (context) => {
        const { incomingId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { values } = context.req.valid('json');
        await service.updateIncoming(incomingId, values, actAs);
        return context.json(
          data(await service.incomingDetail(incomingId, actAs)),
        );
      },
    );
    router.post(
      `${BASE}/incoming/:incomingId/fire`,
      describeRoute({
        tags,
        summary: 'Fire a transition on an incoming document',
        operationId: 'officeFlowsExampleFireIncomingTransition',
        description:
          'A dispatch carries the rows pending now, so a retried click sends the same ones.',
        responses: {
          204: noContent,
          ...fireRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', IncomingParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', FireInput),
      async (context) => {
        const { incomingId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { transition, input } = context.req.valid('json');
        await fire(() =>
          service.fireIncoming(incomingId, transition, input, actAs),
        );
        return context.body(null, 204);
      },
    );
    router.post(
      `${BASE}/incoming/:incomingId/rows`,
      describeRoute({
        tags,
        summary: 'Add a distribution row to an incoming document',
        operationId: 'officeFlowsExampleCreateIncomingRow',
        responses: {
          201: dataResponse(Created, 'The row.'),
          400: apiErrorResponse(
            400,
            'No clerks or no department (`ROW_CLERKS_REQUIRED`, `DEPARTMENT_REQUIRED`, with `fieldViolations`).',
          ),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Not the registrar, or not being dispatched (`ROWS_NOT_ALLOWED`).',
          ),
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', IncomingParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', RowInput),
      async (context) => {
        const { incomingId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const row = context.req.valid('json');
        const id = await service.addRow('incoming', incomingId, row, actAs);
        return context.json({ data: { id: String(id) } }, 201);
      },
    );
    router.post(
      `${BASE}/incoming/:incomingId/managementRows`,
      describeRoute({
        tags,
        summary: 'Copy an incoming document to a management group',
        operationId: 'officeFlowsExampleCreateManagementRow',
        description:
          'A configured group by `groupId`, or a named group of chosen members.',
        responses: {
          201: dataResponse(Created, 'The row.'),
          400: apiErrorResponse(
            400,
            'No such configured group (`MANAGEMENT_GROUP_NOT_FOUND`), or no group name or no members (`MANAGEMENT_GROUP_REQUIRED`), with `fieldViolations`.',
          ),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Not the registrar, or not being dispatched (`MANAGEMENT_NOT_ALLOWED`).',
          ),
          404: apiErrorResponse(404, 'No such document (`RECORD_NOT_FOUND`).'),
          500: internal,
        },
      }),
      apiValidator('param', IncomingParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', ManagementRowInput),
      async (context) => {
        const { incomingId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { groupId, groupName, members } = context.req.valid('json');
        const id = await service.addManagement(
          incomingId,
          {
            ...(groupId === undefined ? {} : { groupId: Number(groupId) }),
            ...(groupName === undefined ? {} : { groupName }),
            ...(members === undefined ? {} : { members }),
          },
          actAs,
        );
        return context.json({ data: { id: String(id) } }, 201);
      },
    );
    router.delete(
      `${BASE}/managementRows/:rowId`,
      describeRoute({
        tags,
        summary: 'Remove a management copy that was not forwarded',
        operationId: 'officeFlowsExampleDeleteManagementRow',
        responses: {
          204: noContent,
          400: apiErrorResponse(
            400,
            'Already forwarded (`MANAGEMENT_ROW_FORWARDED`).',
          ),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Not the registrar (`MANAGEMENT_ROW_NOT_ALLOWED`).',
          ),
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', RowParams),
      apiValidator('query', ActAsQuery),
      async (context) => {
        const { rowId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        await service.removeManagement(rowId, actAs);
        return context.body(null, 204);
      },
    );
    router.delete(
      `${BASE}/rows/:rowId`,
      describeRoute({
        tags,
        summary: 'Remove a distribution row that was not dispatched',
        operationId: 'officeFlowsExampleDeleteRow',
        responses: {
          204: noContent,
          400: apiErrorResponse(400, 'Already dispatched (`ROW_DISPATCHED`).'),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Someone else added it (`ROW_OWNER_ONLY`).',
          ),
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', RowParams),
      apiValidator('query', ActAsQuery),
      async (context) => {
        const { rowId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        await service.removeRow(rowId, actAs);
        return context.body(null, 204);
      },
    );

    // ── Incoming-document tasks ─────────────────────────────────────────

    router.get(
      `${BASE}/tasks`,
      describeRoute({
        tags,
        summary: 'List the persona’s tasks',
        operationId: 'officeFlowsExampleListTasks',
        description:
          'Every kind of task assigned to the persona, each with its `kind`.',
        responses: {
          200: listResponse(OfficeRecord, PageMeta),
          401: unauthorized,
          500: internal,
        },
      }),
      apiValidator('query', ActAsPageQuery),
      async (context) => {
        const query = context.req.valid('query');
        return context.json(
          page(await service.myTasks(query.actAs, query), query),
        );
      },
    );
    router.get(
      `${BASE}/tasks/:taskKind/:taskId`,
      describeRoute({
        tags,
        summary: 'Get a task',
        operationId: 'officeFlowsExampleGetTask',
        responses: {
          200: dataResponse(OfficeDetail),
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', TaskParams),
      apiValidator('query', ActAsQuery),
      async (context) => {
        const { taskKind, taskId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        return context.json(
          data(await service.taskDetail(taskKind, taskId, actAs)),
        );
      },
    );
    router.patch(
      `${BASE}/tasks/:taskKind/:taskId`,
      describeRoute({
        tags,
        summary: 'Edit a task in progress',
        operationId: 'officeFlowsExampleUpdateTask',
        responses: {
          200: dataResponse(OfficeDetail, 'The task as edited.'),
          ...editRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', TaskParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', TaskValuesInput),
      async (context) => {
        const { taskKind, taskId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { values } = context.req.valid('json');
        await service.updateTask(taskKind, taskId, values, actAs);
        return context.json(
          data(await service.taskDetail(taskKind, taskId, actAs)),
        );
      },
    );
    router.post(
      `${BASE}/tasks/:taskKind/:taskId/fire`,
      describeRoute({
        tags,
        summary: 'Fire a transition on a task',
        operationId: 'officeFlowsExampleFireTaskTransition',
        responses: {
          204: noContent,
          ...fireRefusals,
          401: unauthorized,
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', TaskParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', FireInput),
      async (context) => {
        const { taskKind, taskId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const { transition, input } = context.req.valid('json');
        await fire(() =>
          service.fireTask(taskKind, taskId, transition, input, actAs),
        );
        return context.body(null, 204);
      },
    );
    router.post(
      `${BASE}/tasks/:taskKind/:taskId/rows`,
      describeRoute({
        tags,
        summary: 'Add a distribution row to a task',
        operationId: 'officeFlowsExampleCreateTaskRow',
        description:
          'A clerk’s or a team’s task dispatches further; an executor’s has nothing to dispatch.',
        responses: {
          201: dataResponse(Created, 'The row.'),
          400: apiErrorResponse(
            400,
            'No clerks or no department (`ROW_CLERKS_REQUIRED`, `DEPARTMENT_REQUIRED`, with `fieldViolations`).',
          ),
          401: unauthorized,
          403: apiErrorResponse(
            403,
            'Not an assignee of a task in progress (`TASK_ROWS_NOT_ALLOWED`).',
          ),
          404: notFound,
          500: internal,
        },
      }),
      apiValidator('param', DispatchingTaskParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', RowInput),
      async (context) => {
        const { taskKind, taskId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const row = context.req.valid('json');
        const id = await service.addRow(taskKind, taskId, row, actAs);
        return context.json({ data: { id: String(id) } }, 201);
      },
    );

    return new Hono().route('/', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
