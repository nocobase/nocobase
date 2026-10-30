import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  useParams,
  useNavigate,
  useLocation,
  useOutletContext,
} from 'react-router';
import {
  useApiClient,
  useSubmission,
  ApiClientError,
  createUuid,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CircleAlertIcon, PlusIcon, XIcon } from 'lucide-react';
import { cn } from 'cn';
import { BackButton } from '#components/back-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
import { StatusBadge } from '#components/status-badge';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '#components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from '#components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { Separator } from '#components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';
import { FeedbackForm } from '#components/feedback-form';
import { useListData } from '#hooks/use-list-data';
import {
  OnboardingInput,
  emptyOnboarding,
  onboardingIssues,
  onboardingResumeStep,
  type OnboardingDetail,
} from '../../../shared/onboarding.js';
import { Choice } from './choice.js';

const steps = ['basic', 'employment', 'documents', 'confirmation'] as const;
type DocumentKind = OnboardingInput['documents'][number]['kind'];
const documentKinds: DocumentKind[] = [
  'identity',
  'workPermit',
  'serviceAgreement',
];

/** The covering child page every state of the wizard renders in: it keeps the list, its filters and scroll beneath. */
function Frame({
  title,
  status,
  description,
  children,
}: {
  title: string;
  status?: OnboardingDetail['record']['status'];
  description?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <RouteChildPage>
      {/* A full-height column, so the action bar sits at the bottom even when a step is short. */}
      <PageContainer className='flex min-h-full flex-col'>
        <BackButton>{t('onboarding.back')}</BackButton>
        <PageHeader
          title={
            <span className='flex flex-wrap items-center gap-2'>
              {title}
              {status ? (
                <StatusBadge
                  size='sm'
                  tone={status === 'submitted' ? 'success' : 'neutral'}
                >
                  {t(`onboarding.${status}`)}
                </StatusBadge>
              ) : null}
            </span>
          }
          description={description}
        />
        {children}
      </PageContainer>
    </RouteChildPage>
  );
}

export default function OnboardingWizard() {
  const { id } = useParams();
  const { t } = useTranslation();
  const request = useListData<{ data: OnboardingDetail }>(`onboarding/${id}`, {
    active: !!id,
  });
  // Only the version first loaded is a restore: saving remounts the editor with a newer version.
  const version = request.data?.data.record.lifecycleVersion;
  const [restoredVersion, setRestoredVersion] = useState<number>();
  // A case just created by its first save opens with this marker, which is then dropped so a reload counts as a restore.
  const location = useLocation();
  const navigate = useNavigate();
  const created = !!(location.state as { created?: boolean } | null)?.created;
  // Keep the creation origin until this page closes, even if detail arrives after the URL marker is cleared.
  const [createdCaseId, setCreatedCaseId] = useState(created ? id : undefined);
  if (created && createdCaseId !== id) setCreatedCaseId(id);
  useEffect(() => {
    if (created) {
      void navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: null },
      );
    }
  }, [created, id, location.pathname, location.search, navigate]);
  if (version !== undefined && restoredVersion === undefined)
    setRestoredVersion(version);
  if (id && (!request.data || request.error)) {
    const unavailable =
      request.error instanceof ApiClientError &&
      [403, 404].includes(request.error.status);
    return (
      <Frame title={t('onboarding.open')}>
        <p role='status' className='text-sm text-muted-foreground'>
          {t(
            unavailable
              ? 'onboarding.unavailable'
              : request.error
                ? 'onboarding.failed'
                : 'onboarding.loading',
          )}
        </p>
        {request.error && !unavailable ? (
          <Button onClick={request.reload}>{t('onboarding.retry')}</Button>
        ) : null}
      </Frame>
    );
  }
  const detail = request.data?.data;
  return (
    <Editor
      key={`${id ?? 'new'}:${detail?.record.lifecycleVersion ?? 0}`}
      detail={detail}
      restored={
        !created &&
        createdCaseId !== id &&
        (restoredVersion ?? version) === version &&
        detail?.record.status === 'draft'
      }
      refresh={request.reload}
      refreshing={!!id && request.loading}
    />
  );
}
function values(detail?: OnboardingDetail): OnboardingInput {
  if (!detail) return { ...emptyOnboarding, documents: [] };
  const r = detail.record;
  return {
    fullName: r.fullName,
    workEmail: r.workEmail,
    nationality: r.nationality,
    departmentId: r.departmentId,
    jobTitle: r.jobTitle,
    employmentType: r.employmentType,
    startDate: r.startDate,
    probationMonths: r.probationMonths,
    contractEndDate: r.contractEndDate,
    documents: detail.documents,
  };
}
/** The documents this employee needs, each with the answer from an earlier step that requires it. */
function requiredDocuments(input: OnboardingInput) {
  return [
    { kind: 'identity' as const, reason: ['onboarding.reasonEveryone'] },
    ...(input.nationality && input.nationality !== 'CN'
      ? [
          {
            kind: 'workPermit' as const,
            reason: ['onboarding.reasonNationality', input.nationality],
          },
        ]
      : []),
    ...(input.employmentType === 'contractor'
      ? [
          {
            kind: 'serviceAgreement' as const,
            reason: ['onboarding.reasonContractor'],
          },
        ]
      : []),
  ].map((item) => ({
    ...item,
    present: input.documents.some(
      (d) => d.kind === item.kind && d.title && d.referenceNo,
    ),
  }));
}
function Editor({
  detail,
  restored,
  refresh,
  refreshing,
}: {
  detail?: OnboardingDetail;
  restored: boolean;
  refresh: () => void;
  refreshing: boolean;
}) {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const { session } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const { reload } = useOutletContext<{ reload: () => void }>();
  const formId = useId();
  const [input, setInput] = useState(() => values(detail));
  const [step, setStep] = useState(() =>
    detail
      ? detail.record.status === 'submitted'
        ? 3
        : onboardingResumeStep(values(detail))
      : 0,
  );
  const [showRestored, setShowRestored] = useState(restored);
  const [invalid, setInvalid] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<unknown>();
  const [writing, setWriting] = useState(false);
  const lockedRef = useRef(false);
  const navigatingAfterSaveRef = useRef(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const discardRef = useRef<{
    promise: Promise<boolean>;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<'save' | 'submit'>();
  const [documentKeys, setDocumentKeys] = useState(
    () => detail?.documents.map((doc) => doc.id) ?? [],
  );
  const submission = useSubmission({
    scope: `${session?.user.id}:onboarding:${detail?.record.id ?? 'new'}`,
  });
  const busy = writing || refreshing;
  const editable = !detail || detail.actions.edit;
  const departments = useListData<{ data: { id: string; name: string }[] }>(
    'onboarding/candidates?kind=departments',
    { active: editable },
  );
  const decideDiscard = (discard: boolean) => {
    discardRef.current?.resolve(discard);
    discardRef.current = null;
    setConfirmDiscard(false);
  };
  useEffect(
    () => () => {
      discardRef.current?.resolve(false);
    },
    [],
  );
  useNavigationGuard(() => {
    if (navigatingAfterSaveRef.current) return true;
    if (lockedRef.current || refreshing || submission.pending) return false;
    if (!dirty) return true;
    if (discardRef.current) return discardRef.current.promise;
    let resolve!: (value: boolean) => void;
    const promise = new Promise<boolean>((done) => {
      resolve = done;
    });
    discardRef.current = { promise, resolve };
    setConfirmDiscard(true);
    return promise;
  });
  useEffect(() => {
    if (!dirty && !busy && !submission.pending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy, submission.pending]);
  const update = (patch: Partial<OnboardingInput>) => {
    setInput((old) => ({ ...old, ...patch }));
    setDirty(true);
    setInvalid(false);
    setShowRestored(false);
  };
  const go = (target: number) => {
    setStep(target);
    setInvalid(false);
    setShowRestored(false);
  };
  const issues = invalid ? onboardingIssues(input, step) : [];
  const fieldIssue = (name: string) =>
    issues.find((issue) => issue.path[0] === name && issue.path.length === 1);
  const reason = (name: string) =>
    name === 'contractEndDate' &&
    input.contractEndDate &&
    fieldIssue(name)?.message.startsWith('The contract')
      ? t('onboarding.contractOrder')
      : t('onboarding.required');
  const next = () => {
    if (onboardingIssues(input, step).length) {
      setInvalid(true);
      return;
    }
    go(Math.min(3, step + 1));
  };
  const write = async (action: 'save' | 'submit') => {
    if (
      lockedRef.current ||
      refreshing ||
      (action === 'submit' && (!detail || dirty))
    )
      return;
    lockedRef.current = true;
    setPendingAction(action);
    setWriting(true);
    setError(undefined);
    try {
      const payload =
        action === 'save'
          ? {
              ...input,
              ...(detail ? { version: detail.record.lifecycleVersion } : {}),
            }
          : { transition: 'submit', version: detail!.record.lifecycleVersion };
      const result = await submission.run(
        { action, payload },
        async (key, signal, snapshot) => {
          if (action === 'save' && !OnboardingInput.safeParse(input).success) {
            setInvalid(true);
            return undefined;
          }
          if (action === 'submit') {
            const incomplete = onboardingResumeStep(input);
            if (incomplete !== 3) {
              setStep(incomplete);
              setInvalid(true);
              return undefined;
            }
          }
          return api.request<{ data: { id: string } }>({
            path:
              action === 'submit'
                ? `onboarding/${detail!.record.id}/fire`
                : detail
                  ? `onboarding/${detail.record.id}`
                  : 'onboarding',
            method: action === 'save' && detail ? 'PATCH' : 'POST',
            headers: { 'Idempotency-Key': key },
            signal,
            json: snapshot.payload,
          });
        },
      );
      if (result) {
        setDirty(false);
        reload();
        if (detail) refresh();
        else {
          navigatingAfterSaveRef.current = true;
          await navigate(
            { pathname: `../${result.data.id}`, search: location.search },
            { replace: true, state: { created: true } },
          );
        }
      }
    } catch (e) {
      setError(e);
    } finally {
      setWriting(false);
      lockedRef.current = false;
    }
  };
  const fieldId = (name: string) => `${formId}-${name}`;
  const field = (
    name:
      | 'fullName'
      | 'workEmail'
      | 'nationality'
      | 'jobTitle'
      | 'startDate'
      | 'contractEndDate',
    type = 'text',
    hint?: string,
  ) => (
    <Field key={name} data-invalid={!!fieldIssue(name) || undefined}>
      <Label htmlFor={fieldId(name)}>{t(`onboarding.${name}`)}</Label>
      <Input
        id={fieldId(name)}
        name={name}
        type={type}
        maxLength={name === 'nationality' ? 2 : 160}
        value={input[name]}
        aria-invalid={!!fieldIssue(name)}
        onChange={(e) =>
          update({
            [name]:
              name === 'nationality'
                ? e.target.value.toUpperCase()
                : e.target.value,
          })
        }
      />
      {fieldIssue(name) ? (
        <FieldError>{reason(name)}</FieldError>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </Field>
  );
  const documentUpdate = (
    index: number,
    patch: Partial<OnboardingInput['documents'][number]>,
  ) =>
    update({
      documents: input.documents.map((doc, i) =>
        i === index ? { ...doc, ...patch } : doc,
      ),
    });
  const removeDocument = (index: number) => {
    setDocumentKeys((keys) => keys.filter((_, i) => i !== index));
    update({ documents: input.documents.filter((_, i) => i !== index) });
  };
  const required = requiredDocuments(input);
  const departmentName =
    departments.data?.data.find((d) => d.id === input.departmentId)?.name ??
    detail?.departmentName;
  const summary: [string, [string, string | number | null | undefined][]][] = [
    [
      'basic',
      [
        ['fullName', input.fullName],
        ['workEmail', input.workEmail],
        ['nationality', input.nationality],
      ],
    ],
    [
      'employment',
      [
        ['department', departmentName],
        ['jobTitle', input.jobTitle],
        [
          'employmentType',
          input.employmentType
            ? t(`onboarding.${input.employmentType}`)
            : undefined,
        ],
        ['startDate', input.startDate],
        input.employmentType === 'fullTime'
          ? ['probationMonths', input.probationMonths]
          : ['contractEndDate', input.contractEndDate],
      ],
    ],
  ];
  // The focusable control each issue of the current step leads to.
  const issueTargets = [
    ...new Map(
      issues.map((issue) => {
        const name = String(issue.path[0]);
        const label =
          name === 'departmentId'
            ? t('onboarding.department')
            : name === 'documents'
              ? t('onboarding.documents')
              : t(`onboarding.${name}`);
        return [
          issue.path.join('.'),
          {
            target:
              name === 'documents' && issue.path.length > 1
                ? fieldId(
                    `document-${String(issue.path[2])}-${String(issue.path[1])}`,
                  )
                : name === 'documents'
                  ? fieldId('add-document')
                  : fieldId(name),
            text:
              name === 'documents' && issue.path.length === 1
                ? t('onboarding.documentMissing', {
                    kind: t(
                      `onboarding.${documentKinds.find((kind) => issue.message.includes(kind)) ?? 'identity'}`,
                    ),
                  })
                : name === 'documents'
                  ? `${t(issue.path[2] === 'title' ? 'onboarding.documentTitle' : 'onboarding.referenceNo')} ${Number(issue.path[1]) + 1}: ${t('onboarding.required')}`
                  : `${label}: ${reason(name)}`,
          },
        ] as const;
      }),
    ).values(),
  ];
  const actionsLocked = busy || submission.pending;
  const title = detail
    ? detail.record.fullName || t('onboarding.open')
    : t('onboarding.new');
  const description = !detail
    ? t('onboarding.newDescription')
    : [detail.record.jobTitle, detail.departmentName]
        .filter(Boolean)
        .join(' · ') || undefined;
  const stepState = (index: number) =>
    index === step
      ? invalid
        ? 'error'
        : 'current'
      : index < step || detail?.record.status === 'submitted'
        ? 'done'
        : 'upcoming';
  const saveState = dirty ? (
    <span className='inline-flex items-center gap-1.5 text-sm text-(--status-warning)'>
      <span className='size-1.5 rounded-full bg-current' aria-hidden />
      {t('onboarding.unsaved')}
    </span>
  ) : (
    <span className='inline-flex items-center gap-1.5 text-sm text-muted-foreground'>
      {detail ? (
        <CheckIcon className='size-4 text-(--status-success)' aria-hidden />
      ) : null}
      {t(detail ? 'onboarding.saved' : 'onboarding.notSaved')}
    </span>
  );
  return (
    <Frame
      title={title}
      status={detail?.record.status}
      description={description}
    >
      <AlertDialog
        open={confirmDiscard}
        onOpenChange={(open) => {
          if (!open) decideDiscard(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('onboarding.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('onboarding.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('onboarding.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => decideDiscard(true)}>
              {t('onboarding.discardAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Below lg the step list collapses into the current step and a four-part progress bar. */}
      <div className='space-y-2 lg:hidden'>
        <p className='text-sm text-muted-foreground'>
          {t('onboarding.stepOf', { current: step + 1, total: steps.length })} ·{' '}
          <span className='font-medium text-foreground'>
            {t(`onboarding.${steps[step]}`)}
          </span>
        </p>
        <div className='grid grid-cols-4 gap-1' aria-hidden>
          {steps.map((name, index) => (
            <span
              key={name}
              className={cn(
                'h-1 rounded-full bg-input',
                stepState(index) === 'error'
                  ? 'bg-destructive'
                  : stepState(index) !== 'upcoming' && 'bg-primary',
              )}
            />
          ))}
        </div>
      </div>
      <div className='grid items-start gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]'>
        <nav aria-label={t('onboarding.title')} className='hidden lg:block'>
          <ol className='sticky top-0'>
            {steps.map((name, index) => {
              const state = stepState(index);
              // Completed steps can be reopened; moving forward always goes through Next.
              const reachable =
                editable && index < step && !actionsLocked && state === 'done';
              const label = (
                <>
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                      state === 'done' &&
                        'border-primary bg-primary text-primary-foreground',
                      state === 'current' &&
                        'border-2 border-primary text-primary ring-4 ring-primary/10',
                      state === 'error' &&
                        'border-destructive bg-destructive/10 text-destructive',
                      state === 'upcoming' &&
                        'border-input bg-card text-muted-foreground',
                    )}
                  >
                    {state === 'done' ? (
                      <CheckIcon className='size-3.5' />
                    ) : state === 'error' ? (
                      <CircleAlertIcon className='size-3.5' />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className='min-w-0 pt-1 text-left'>
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        state === 'current' && 'text-primary',
                        state === 'upcoming' && 'text-muted-foreground',
                      )}
                    >
                      {t(`onboarding.${name}`)}
                    </span>
                    <span
                      className={cn(
                        'block text-xs text-muted-foreground',
                        state === 'error' && 'text-destructive',
                      )}
                    >
                      {t(
                        state === 'error'
                          ? 'onboarding.needsAttention'
                          : `onboarding.${name}Summary`,
                      )}
                    </span>
                  </span>
                </>
              );
              return (
                <li
                  key={name}
                  aria-current={index === step ? 'step' : undefined}
                  className={cn(
                    'relative pb-6 last:pb-0',
                    index < steps.length - 1 &&
                      'before:absolute before:top-8 before:bottom-1 before:left-3.5 before:w-px before:bg-input',
                    index < steps.length - 1 &&
                      state === 'done' &&
                      'before:bg-primary',
                  )}
                >
                  {reachable ? (
                    <button
                      type='button'
                      className='flex w-full gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                      onClick={() => go(index)}
                    >
                      {label}
                    </button>
                  ) : (
                    <div className='flex gap-3'>{label}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className='min-w-0 space-y-4'>
          {submission.pending ? (
            <Alert>
              <AlertDescription role='status'>
                {t('onboarding.pending')}
              </AlertDescription>
            </Alert>
          ) : null}
          {error instanceof ApiClientError && error.status === 409 ? (
            <Alert>
              <AlertDescription>
                {t('onboarding.changed')}{' '}
                <Button
                  disabled={actionsLocked}
                  variant='outline'
                  onClick={refresh}
                >
                  {t('onboarding.reload')}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <FeedbackForm
            id={formId}
            error={error}
            errorContent={error ? t('onboarding.operationFailed') : undefined}
            submitting={busy}
            onSubmit={async (e) => {
              e.preventDefault();
              await write('save');
            }}
          >
            <Card>
              <CardHeader>
                <h2 className='font-heading text-lg font-semibold'>
                  {t(`onboarding.${steps[step]}`)}
                </h2>
                <CardDescription>
                  {t(
                    detail?.record.status === 'submitted'
                      ? 'onboarding.submittedDescription'
                      : `onboarding.${steps[step]}Description`,
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {showRestored ? (
                  <Alert className='border-primary/20 bg-primary/5 text-primary'>
                    <AlertTitle>{t('onboarding.restored')}</AlertTitle>
                    <AlertDescription className='text-primary/90'>
                      {t('onboarding.restoredDescription', {
                        step: t(`onboarding.${steps[step]}`),
                      })}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {invalid ? (
                  <Alert variant='destructive'>
                    <CircleAlertIcon />
                    <AlertTitle>{t('onboarding.invalid')}</AlertTitle>
                    {issueTargets.length ? (
                      <AlertDescription>
                        <p className='font-medium'>
                          {t('onboarding.issueCount', {
                            count: issueTargets.length,
                          })}
                        </p>
                        <ul className='space-y-0.5'>
                          {issueTargets.map((issue) => (
                            <li key={issue.target + issue.text}>
                              <button
                                type='button'
                                className='inline text-left underline underline-offset-2'
                                onClick={() =>
                                  document.getElementById(issue.target)?.focus()
                                }
                              >
                                {issue.text}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    ) : null}
                  </Alert>
                ) : null}
                <fieldset
                  disabled={!editable || actionsLocked}
                  className='min-w-0 space-y-6'
                >
                  {step === 0 ? (
                    <div className='grid gap-5 sm:grid-cols-2'>
                      {field('fullName')}
                      {field('workEmail', 'email')}
                      {field(
                        'nationality',
                        'text',
                        t('onboarding.nationalityHint'),
                      )}
                    </div>
                  ) : null}
                  {step === 1 ? (
                    <>
                      <FieldSet>
                        <FieldLegend
                          variant='label'
                          className='text-muted-foreground'
                        >
                          {t('onboarding.position')}
                        </FieldLegend>
                        <div className='grid gap-5 sm:grid-cols-2'>
                          <Field
                            data-invalid={
                              !!fieldIssue('departmentId') || undefined
                            }
                          >
                            <Label htmlFor={fieldId('departmentId')}>
                              {t('onboarding.department')}
                            </Label>
                            <Choice
                              id={fieldId('departmentId')}
                              label={t('onboarding.department')}
                              value={input.departmentId ?? ''}
                              selectedName={detail?.departmentName ?? undefined}
                              options={departments.data?.data ?? []}
                              disabled={
                                departments.loading || !!departments.error
                              }
                              invalid={!!fieldIssue('departmentId')}
                              onChange={(departmentId) =>
                                update({ departmentId: departmentId || null })
                              }
                            />
                            {departments.error ? (
                              <Button
                                type='button'
                                variant='outline'
                                onClick={departments.reload}
                              >
                                {t('onboarding.retry')}
                              </Button>
                            ) : !departments.loading &&
                              !departments.data?.data.length ? (
                              <FieldDescription>
                                {t('onboarding.noDepartments')}
                              </FieldDescription>
                            ) : null}
                            {fieldIssue('departmentId') ? (
                              <FieldError>
                                {t('onboarding.required')}
                              </FieldError>
                            ) : null}
                          </Field>
                          {field('jobTitle')}
                        </div>
                      </FieldSet>
                      <Separator />
                      <FieldSet>
                        <FieldLegend
                          variant='label'
                          className='text-muted-foreground'
                        >
                          {t('onboarding.contract')}
                        </FieldLegend>
                        <Field
                          data-invalid={
                            !!fieldIssue('employmentType') || undefined
                          }
                        >
                          <Label id={fieldId('employmentType-label')}>
                            {t('onboarding.employmentType')}
                          </Label>
                          <ToggleGroup
                            variant='outline'
                            aria-labelledby={fieldId('employmentType-label')}
                            value={
                              input.employmentType ? [input.employmentType] : []
                            }
                            onValueChange={(value: unknown[]) =>
                              update({
                                employmentType: (value[0] ??
                                  null) as OnboardingInput['employmentType'],
                              })
                            }
                          >
                            {(['fullTime', 'contractor'] as const).map(
                              (type, index) => (
                                <ToggleGroupItem
                                  key={type}
                                  value={type}
                                  id={
                                    index === 0
                                      ? fieldId('employmentType')
                                      : undefined
                                  }
                                  aria-invalid={
                                    !!fieldIssue('employmentType') || undefined
                                  }
                                >
                                  {t(`onboarding.${type}`)}
                                </ToggleGroupItem>
                              ),
                            )}
                          </ToggleGroup>
                          {fieldIssue('employmentType') ? (
                            <FieldError>{t('onboarding.required')}</FieldError>
                          ) : (
                            <FieldDescription>
                              {t('onboarding.employmentHint')}
                            </FieldDescription>
                          )}
                        </Field>
                        <div className='grid gap-5 sm:grid-cols-2'>
                          {field('startDate', 'date')}
                          {input.employmentType === 'fullTime' ? (
                            <Field
                              data-invalid={
                                !!fieldIssue('probationMonths') || undefined
                              }
                            >
                              <Label htmlFor={fieldId('probationMonths')}>
                                {t('onboarding.probationMonths')}
                              </Label>
                              <Input
                                id={fieldId('probationMonths')}
                                name='probationMonths'
                                type='number'
                                min={1}
                                max={12}
                                value={input.probationMonths ?? ''}
                                aria-invalid={!!fieldIssue('probationMonths')}
                                onChange={(e) =>
                                  update({
                                    probationMonths:
                                      e.target.value === ''
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                              />
                              {fieldIssue('probationMonths') ? (
                                <FieldError>
                                  {t('onboarding.required')}
                                </FieldError>
                              ) : null}
                            </Field>
                          ) : null}
                          {input.employmentType === 'contractor'
                            ? field('contractEndDate', 'date')
                            : null}
                        </div>
                      </FieldSet>
                    </>
                  ) : null}
                  {step === 2 ? (
                    <>
                      <section className='space-y-2'>
                        <h3 className='text-sm font-medium text-muted-foreground'>
                          {t('onboarding.requiredDocuments')}
                        </h3>
                        <ul className='flex flex-wrap gap-2'>
                          {required.map((item) => (
                            <li key={item.kind}>
                              <StatusBadge
                                tone={item.present ? 'success' : 'warning'}
                              >
                                {item.present ? (
                                  <CheckIcon data-icon='inline-start' />
                                ) : null}
                                {t(`onboarding.${item.kind}`)} ·{' '}
                                {t(item.reason[0], { code: item.reason[1] })}
                              </StatusBadge>
                            </li>
                          ))}
                        </ul>
                      </section>
                      {input.documents.length ? (
                        <div className='rounded-lg border'>
                          {/* Column headings; below md each row stacks with its own labels. */}
                          <div
                            className='hidden grid-cols-[12rem_minmax(0,1fr)_10rem_2rem] gap-3 border-b bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground md:grid'
                            aria-hidden
                          >
                            <span>{t('onboarding.kind')}</span>
                            <span>{t('onboarding.documentTitle')}</span>
                            <span>{t('onboarding.referenceNo')}</span>
                          </div>
                          <ol>
                            {input.documents.map((doc, index) => {
                              const docIssue = (part: string) =>
                                issues.some(
                                  (issue) =>
                                    issue.path[0] === 'documents' &&
                                    issue.path[1] === index &&
                                    issue.path[2] === part,
                                );
                              return (
                                <li
                                  key={documentKeys[index]}
                                  className='relative grid gap-3 border-b p-3 last:border-b-0 md:grid-cols-[12rem_minmax(0,1fr)_10rem_2rem] md:items-start'
                                >
                                  <div className='space-y-1.5'>
                                    <span className='text-sm font-medium md:sr-only'>
                                      {t('onboarding.kind')}
                                    </span>
                                    <Choice
                                      label={`${t('onboarding.kind')} ${index + 1}`}
                                      value={doc.kind}
                                      options={documentKinds.map((id) => ({
                                        id,
                                        name: t(`onboarding.${id}`),
                                      }))}
                                      onChange={(kind) => {
                                        if (kind)
                                          documentUpdate(index, {
                                            kind: kind as DocumentKind,
                                          });
                                      }}
                                    />
                                  </div>
                                  {(['title', 'referenceNo'] as const).map(
                                    (part) => (
                                      <div key={part} className='space-y-1.5'>
                                        <Label
                                          htmlFor={fieldId(
                                            `document-${part}-${index}`,
                                          )}
                                          className='md:sr-only'
                                        >
                                          {t(
                                            part === 'title'
                                              ? 'onboarding.documentTitle'
                                              : 'onboarding.referenceNo',
                                          )}{' '}
                                          {index + 1}
                                        </Label>
                                        <Input
                                          id={fieldId(
                                            `document-${part}-${index}`,
                                          )}
                                          name={`documents.${index}.${part}`}
                                          maxLength={160}
                                          value={doc[part]}
                                          aria-invalid={docIssue(part)}
                                          onChange={(e) =>
                                            documentUpdate(index, {
                                              [part]: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    ),
                                  )}
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='absolute top-2 right-2 md:static'
                                    aria-label={`${t('onboarding.removeDocument')} ${index + 1}`}
                                    onClick={() => removeDocument(index)}
                                  >
                                    <XIcon />
                                  </Button>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      ) : (
                        <p className='text-sm text-muted-foreground'>
                          {t('onboarding.noDocuments')}
                        </p>
                      )}
                      <Button
                        id={fieldId('add-document')}
                        type='button'
                        variant='outline'
                        disabled={input.documents.length >= 20}
                        onClick={() => {
                          setDocumentKeys((keys) => [...keys, createUuid()]);
                          update({
                            documents: [
                              ...input.documents,
                              { kind: 'identity', title: '', referenceNo: '' },
                            ],
                          });
                        }}
                      >
                        <PlusIcon data-icon='inline-start' />
                        {t('onboarding.addDocument')}
                      </Button>
                    </>
                  ) : null}
                  {step === 3 ? (
                    <>
                      {summary.map(([group, rows], index) => (
                        <section
                          key={group}
                          className={cn(
                            'space-y-3',
                            index > 0 && 'border-t pt-6',
                          )}
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <h3 className='text-sm font-medium text-muted-foreground'>
                              {t(`onboarding.${group}`)}
                            </h3>
                            {editable ? (
                              <Button
                                type='button'
                                variant='link'
                                size='sm'
                                aria-label={`${t('onboarding.edit')} ${t(`onboarding.${group}`)}`}
                                onClick={() => go(index)}
                              >
                                {t('onboarding.edit')}
                              </Button>
                            ) : null}
                          </div>
                          <dl className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
                            {rows.map(([name, value]) => (
                              <div key={name}>
                                <dt className='text-muted-foreground'>
                                  {t(`onboarding.${name}`)}
                                </dt>
                                <dd className='mt-0.5 break-words'>
                                  {value ? String(value) : t('onboarding.none')}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </section>
                      ))}
                      <section className='space-y-3 border-t pt-6'>
                        <div className='flex items-center justify-between gap-2'>
                          <h3 className='text-sm font-medium text-muted-foreground'>
                            {t('onboarding.documents')} ·{' '}
                            {input.documents.length}
                          </h3>
                          {editable ? (
                            <Button
                              type='button'
                              variant='link'
                              size='sm'
                              aria-label={`${t('onboarding.edit')} ${t('onboarding.documents')}`}
                              onClick={() => go(2)}
                            >
                              {t('onboarding.edit')}
                            </Button>
                          ) : null}
                        </div>
                        <div className='overflow-x-auto rounded-lg border'>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('onboarding.kind')}</TableHead>
                                <TableHead>
                                  {t('onboarding.documentTitle')}
                                </TableHead>
                                <TableHead>
                                  {t('onboarding.referenceNo')}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {input.documents.map((doc, index) => (
                                <TableRow key={documentKeys[index]}>
                                  <TableCell>
                                    {t(`onboarding.${doc.kind}`)}
                                  </TableCell>
                                  <TableCell className='whitespace-normal break-words'>
                                    {doc.title}
                                  </TableCell>
                                  <TableCell className='whitespace-normal break-words'>
                                    {doc.referenceNo}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {required.every((item) => item.present) ? (
                          <p className='inline-flex items-center gap-1.5 text-sm text-muted-foreground'>
                            <CheckIcon
                              className='size-4 text-(--status-success)'
                              aria-hidden
                            />
                            {t('onboarding.documentsComplete')}
                          </p>
                        ) : null}
                      </section>
                      {dirty ? (
                        <p
                          role='status'
                          className='text-sm text-(--status-warning)'
                        >
                          {t('onboarding.saveFirst')}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </fieldset>
                {detail?.employee ? (
                  <section className='space-y-2 border-t pt-6'>
                    <h2 className='font-semibold'>
                      {t('onboarding.employee')}
                    </h2>
                    <p className='break-words text-sm'>
                      {detail.employee.fullName} · {detail.employee.workEmail}
                    </p>
                    <p className='break-all text-sm text-muted-foreground'>
                      {t('onboarding.employeeId')}: {detail.employee.id}
                    </p>
                  </section>
                ) : null}
                {detail && step === 3 ? (
                  <section className='space-y-2 border-t pt-6'>
                    <h2 className='font-semibold'>{t('onboarding.history')}</h2>
                    <ol className='space-y-1 text-sm text-muted-foreground'>
                      {detail.history.map((h) => (
                        <li key={h.id}>
                          {t(
                            h.transition === '$create'
                              ? 'onboarding.created'
                              : 'onboarding.submitted',
                          )}{' '}
                          · {new Date(h.at).toLocaleString(i18n.language)}
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </CardContent>
            </Card>
          </FeedbackForm>
        </div>
      </div>
      {editable ? (
        // Pinned to the bottom of the child page's scroller, so the actions stay reachable on long steps.
        <div className='sticky bottom-0 z-10 -mx-6 mt-auto -mb-6 border-t bg-background/95 px-6 py-3 backdrop-blur md:-mx-8 md:-mb-8 md:px-8'>
          <div className='grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]'>
            <div className='flex flex-wrap items-center justify-between gap-3 lg:col-start-2'>
              <div className='flex items-center gap-3'>
                <Button
                  type='submit'
                  form={formId}
                  variant='outline'
                  disabled={
                    busy || (submission.pending && pendingAction !== 'save')
                  }
                >
                  {t('onboarding.save')}
                </Button>
                {saveState}
              </div>
              <div className='grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto [&>:only-child]:col-span-2'>
                {step > 0 ? (
                  <Button
                    variant='outline'
                    disabled={actionsLocked}
                    onClick={() => go(step - 1)}
                  >
                    {t('onboarding.previous')}
                  </Button>
                ) : null}
                {step < 3 ? (
                  <Button disabled={actionsLocked} onClick={next}>
                    {t('onboarding.next')}
                  </Button>
                ) : detail?.actions.submit ? (
                  <Button
                    disabled={
                      busy ||
                      dirty ||
                      (submission.pending && pendingAction !== 'submit')
                    }
                    onClick={() => void write('submit')}
                  >
                    {t('onboarding.submit')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Frame>
  );
}
