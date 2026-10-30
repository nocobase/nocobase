import { useId, useRef, useState } from 'react';
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
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDrawer } from '#components/route-drawer';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
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

export default function OnboardingWizard() {
  const { id } = useParams();
  const { t } = useTranslation();
  const request = useListData<{ data: OnboardingDetail }>(`onboarding/${id}`, {
    active: !!id,
  });
  if (id && (!request.data || request.error)) {
    const unavailable =
      request.error instanceof ApiClientError &&
      [403, 404].includes(request.error.status);
    return (
      <RouteDrawer title={t('onboarding.open')}>
        <p role='status'>
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
      </RouteDrawer>
    );
  }
  return (
    <Editor
      key={`${id ?? 'new'}:${request.data?.data.record.lifecycleVersion ?? 0}`}
      detail={request.data?.data}
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
function Editor({
  detail,
  refresh,
  refreshing,
}: {
  detail?: OnboardingDetail;
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
  const [invalid, setInvalid] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState<unknown>();
  const [writing, setWriting] = useState(false);
  const lockedRef = useRef(false);
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
  const update = (patch: Partial<OnboardingInput>) => {
    setInput((old) => ({ ...old, ...patch }));
    setDirty(true);
    setDiscard(false);
    setInvalid(false);
  };
  const issueFields = invalid
    ? new Set(
        onboardingIssues(input, step).map((issue) => String(issue.path[0])),
      )
    : new Set<string>();
  const next = () => {
    if (onboardingIssues(input, step).length) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setStep((old) => Math.min(3, old + 1));
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
        else
          await navigate(
            { pathname: `../${result.data.id}`, search: location.search },
            { replace: true },
          );
      }
    } catch (e) {
      setError(e);
    } finally {
      setWriting(false);
      lockedRef.current = false;
    }
  };
  const field = (
    name:
      | 'fullName'
      | 'workEmail'
      | 'nationality'
      | 'jobTitle'
      | 'startDate'
      | 'contractEndDate',
    type = 'text',
  ) => (
    <div className='space-y-2' key={name}>
      <Label htmlFor={`${formId}-${name}`}>{t(`onboarding.${name}`)}</Label>
      <Input
        id={`${formId}-${name}`}
        name={name}
        type={type}
        maxLength={name === 'nationality' ? 2 : 160}
        value={input[name]}
        aria-invalid={issueFields.has(name)}
        onChange={(e) =>
          update({
            [name]:
              name === 'nationality'
                ? e.target.value.toUpperCase()
                : e.target.value,
          })
        }
      />
      {issueFields.has(name) ? (
        <p className='text-sm text-destructive'>{t('onboarding.required')}</p>
      ) : null}
    </div>
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
  const steps = ['basic', 'employment', 'documents', 'confirmation'];
  const summary = [
    ['fullName', input.fullName],
    ['workEmail', input.workEmail],
    ['nationality', input.nationality],
    [
      'department',
      departments.data?.data.find((d) => d.id === input.departmentId)?.name ??
        detail?.departmentName,
    ],
    ['jobTitle', input.jobTitle],
    ['employmentType', t(`onboarding.${input.employmentType ?? 'none'}`)],
    ['startDate', input.startDate],
    input.employmentType === 'fullTime'
      ? ['probationMonths', input.probationMonths]
      : ['contractEndDate', input.contractEndDate],
  ];
  return (
    <RouteDrawer
      title={t(detail ? 'onboarding.open' : 'onboarding.new')}
      className='sm:w-3xl'
      beforeClose={() => {
        if (busy || submission.pending) return false;
        if (dirty) {
          setDiscard(true);
          return false;
        }
        return true;
      }}
      footer={
        <>
          {step > 0 && editable ? (
            <Button
              variant='outline'
              disabled={busy || submission.pending}
              onClick={() => {
                setStep((s) => s - 1);
                setInvalid(false);
              }}
            >
              {t('onboarding.previous')}
            </Button>
          ) : null}
          {step < 3 && editable ? (
            <Button disabled={busy || submission.pending} onClick={next}>
              {t('onboarding.next')}
            </Button>
          ) : null}
          {editable ? (
            <Button
              type='submit'
              form={formId}
              disabled={
                busy || (submission.pending && pendingAction !== 'save')
              }
            >
              {t('onboarding.save')}
            </Button>
          ) : null}
          {step === 3 && detail?.actions.submit ? (
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
        </>
      }
    >
      <ol
        aria-label={t('onboarding.title')}
        className='grid grid-cols-2 gap-2 text-sm sm:grid-cols-4'
      >
        {steps.map((name, index) => (
          <li
            key={name}
            aria-current={step === index ? 'step' : undefined}
            className={
              step === index
                ? 'font-semibold text-primary'
                : 'text-muted-foreground'
            }
          >
            {index + 1}. {t(`onboarding.${name}`)}
          </li>
        ))}
      </ol>
      {detail ? (
        <p className='font-medium'>{t(`onboarding.${detail.record.status}`)}</p>
      ) : null}
      {discard ? (
        <Alert>
          <AlertDescription>
            {t('onboarding.discard')}{' '}
            <Button
              variant='outline'
              onClick={() => {
                setDirty(false);
                void navigate({ pathname: '..', search: location.search });
              }}
            >
              {t('onboarding.discardAction')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {submission.pending ? (
        <p role='status'>{t('onboarding.pending')}</p>
      ) : null}
      {error instanceof ApiClientError && error.status === 409 ? (
        <Alert>
          <AlertDescription>
            {t('onboarding.changed')}{' '}
            <Button
              disabled={busy || submission.pending}
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
        <fieldset
          disabled={!editable || busy || submission.pending}
          className='min-w-0 space-y-5'
        >
          <h2 className='font-semibold'>{t(`onboarding.${steps[step]}`)}</h2>
          {step === 0 ? (
            <>
              {field('fullName')}
              {field('workEmail', 'email')}
              {field('nationality')}
            </>
          ) : null}
          {step === 1 ? (
            <>
              <div className='space-y-2'>
                <Label>{t('onboarding.department')}</Label>
                <Choice
                  label={t('onboarding.department')}
                  value={input.departmentId ?? ''}
                  selectedName={detail?.departmentName ?? undefined}
                  options={departments.data?.data ?? []}
                  disabled={departments.loading || !!departments.error}
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
                ) : !departments.loading && !departments.data?.data.length ? (
                  <p className='text-sm text-muted-foreground'>
                    {t('onboarding.noDepartments')}
                  </p>
                ) : null}
                {issueFields.has('departmentId') ? (
                  <p className='text-sm text-destructive'>
                    {t('onboarding.required')}
                  </p>
                ) : null}
              </div>
              {field('jobTitle')}
              <Choice
                label={t('onboarding.employmentType')}
                value={input.employmentType ?? ''}
                options={['fullTime', 'contractor'].map((id) => ({
                  id,
                  name: t(`onboarding.${id}`),
                }))}
                onChange={(v) =>
                  update({
                    employmentType: (v ||
                      null) as OnboardingInput['employmentType'],
                  })
                }
              />
              {field('startDate', 'date')}
              {input.employmentType === 'fullTime' ? (
                <div className='space-y-2'>
                  <Label htmlFor={`${formId}-probation`}>
                    {t('onboarding.probationMonths')}
                  </Label>
                  <Input
                    id={`${formId}-probation`}
                    name='probationMonths'
                    type='number'
                    min={1}
                    max={12}
                    value={input.probationMonths ?? ''}
                    aria-invalid={issueFields.has('probationMonths')}
                    onChange={(e) =>
                      update({
                        probationMonths:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              ) : null}
              {input.employmentType === 'contractor'
                ? field('contractEndDate', 'date')
                : null}
              <p className='text-sm text-muted-foreground'>
                {t('onboarding.employmentHint')}
              </p>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <p className='text-sm text-muted-foreground'>
                {t('onboarding.documentHint')}
              </p>
              {input.documents.map((doc, index) => (
                <div
                  key={documentKeys[index]}
                  className='space-y-3 rounded-lg border p-4'
                >
                  <Choice
                    label={`${t('onboarding.kind')} ${index + 1}`}
                    value={doc.kind}
                    options={['identity', 'workPermit', 'serviceAgreement'].map(
                      (id) => ({ id, name: t(`onboarding.${id}`) }),
                    )}
                    onChange={(kind) => {
                      if (kind)
                        documentUpdate(index, {
                          kind: kind as typeof doc.kind,
                        });
                    }}
                  />
                  <div className='space-y-2'>
                    <Label htmlFor={`${formId}-document-title-${index}`}>
                      {t('onboarding.documentTitle')} {index + 1}
                    </Label>
                    <Input
                      id={`${formId}-document-title-${index}`}
                      name={`documents.${index}.title`}
                      maxLength={160}
                      value={doc.title}
                      onChange={(e) =>
                        documentUpdate(index, { title: e.target.value })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor={`${formId}-document-reference-${index}`}>
                      {t('onboarding.referenceNo')} {index + 1}
                    </Label>
                    <Input
                      id={`${formId}-document-reference-${index}`}
                      name={`documents.${index}.referenceNo`}
                      maxLength={160}
                      value={doc.referenceNo}
                      onChange={(e) =>
                        documentUpdate(index, { referenceNo: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setDocumentKeys((keys) =>
                        keys.filter((_, i) => i !== index),
                      );
                      update({
                        documents: input.documents.filter(
                          (_, i) => i !== index,
                        ),
                      });
                    }}
                  >
                    {t('onboarding.removeDocument')}
                  </Button>
                </div>
              ))}
              <Button
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
                {t('onboarding.addDocument')}
              </Button>
            </>
          ) : null}
          {step === 3 ? (
            <>
              <dl className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                {summary.map(([name, value]) => (
                  <div key={name}>
                    <dt className='text-muted-foreground'>
                      {t(`onboarding.${name}`)}
                    </dt>
                    <dd className='break-words font-medium'>
                      {value || t('onboarding.none')}
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className='space-y-2 text-sm'>
                {input.documents.map((doc, index) => (
                  <li key={documentKeys[index]} className='break-words'>
                    {t(`onboarding.${doc.kind}`)}: {doc.title} ·{' '}
                    {doc.referenceNo}
                  </li>
                ))}
              </ul>
              {dirty ? (
                <p role='status' className='text-sm text-muted-foreground'>
                  {t('onboarding.saveFirst')}
                </p>
              ) : null}
            </>
          ) : null}
        </fieldset>
        {invalid ? (
          <p role='alert' className='mt-3 text-sm text-destructive'>
            {t('onboarding.invalid')}
          </p>
        ) : null}
      </FeedbackForm>
      {detail?.employee ? (
        <section className='space-y-2 border-t pt-4'>
          <h2 className='font-semibold'>{t('onboarding.employee')}</h2>
          <p className='break-words'>
            {detail.employee.fullName} · {detail.employee.workEmail}
          </p>
          <p className='break-all text-sm text-muted-foreground'>
            {t('onboarding.employeeId')}: {detail.employee.id}
          </p>
        </section>
      ) : null}
      {detail ? (
        <section className='space-y-3 border-t pt-4'>
          <h2 className='font-semibold'>{t('onboarding.history')}</h2>
          <ol className='space-y-2 text-sm text-muted-foreground'>
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
    </RouteDrawer>
  );
}
