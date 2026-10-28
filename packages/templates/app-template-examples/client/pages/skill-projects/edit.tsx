import {
  ApiClientError,
  useApiClient,
  useSubmission,
  useNavigationGuard,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useLocation,
} from 'react-router';
import { useForm } from 'react-hook-form';
import { FeedbackForm } from '#components/feedback-form';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { useListData } from '#hooks/use-list-data';
import type { SkillProject } from './index.js';

export default function SkillProjectEditPage(): ReactElement {
  const { projectId } = useParams();
  const { t } = useTranslation();
  const { reload } = useOutletContext<{ reload: () => void }>();
  const request = useListData<{ data: SkillProject }>(
    `skillProjects/${encodeURIComponent(projectId ?? '')}`,
    { active: Boolean(projectId) },
  );
  const status =
    request.error instanceof ApiClientError ? request.error.status : undefined;
  useEffect(() => {
    if (status === 404) reload();
  }, [status, reload]);
  if (!projectId) return <ProjectEditor key='new' />;
  if (request.error || !request.data)
    return (
      <RouteDialog
        title={t('skillProjects.edit')}
        className='sm:max-w-md'
        footer={<CancelButton />}
      >
        {request.error ? (
          <Alert variant='destructive'>
            <AlertDescription className='flex flex-col items-start gap-2'>
              <p>
                {t(
                  status === 404
                    ? 'skillProjects.gone'
                    : status === 401
                      ? 'skillProjects.expired'
                      : status === 403
                        ? 'skillProjects.denied'
                        : 'skillProjects.failed',
                )}
              </p>
              {status === 401 ? (
                <Link to='/login'>{t('skillProjects.signIn')}</Link>
              ) : [403, 404].includes(status ?? 0) ? null : (
                <Button onClick={request.reload}>
                  {t('skillProjects.retry')}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div
            role='status'
            aria-label={t('skillProjects.loading')}
            className='flex flex-col gap-2'
          >
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-8 w-full' />
          </div>
        )}
      </RouteDialog>
    );
  return (
    <ProjectEditor key={request.data.data.id} project={request.data.data} />
  );
}

function CancelButton({
  disabled = false,
}: {
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <Button variant='outline' disabled={disabled} onClick={() => void close()}>
      {t('skillProjects.cancel')}
    </Button>
  );
}

function ProjectEditor({
  project,
}: {
  readonly project?: SkillProject;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const { session } = useAuthentication();
  const formId = useId();
  const submission = useSubmission({
    scope: `${session?.user.id}:skillProjects:${project?.id ?? 'new'}`,
  });
  const form = useForm({
    defaultValues: { name: project?.name ?? '' },
    shouldFocusError: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { reload, onSaved } = useOutletContext<{
    reload: () => void;
    onSaved: (project: SkillProject) => void;
  }>();
  const toaster = useToaster();
  const [error, setError] = useState<unknown>();
  const [gone, setGone] = useState(false);
  const busyRef = useRef(false);
  const savedRef = useRef(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const discardRef = useRef<{
    promise: Promise<boolean>;
    resolve: (value: boolean) => void;
  } | null>(null);
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
    if (savedRef.current) return true;
    if (busyRef.current || submission.submitting || submission.pending)
      return false;
    if (!form.formState.isDirty) return true;
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
    const warn = (event: BeforeUnloadEvent) => {
      if (busyRef.current || submission.pending || form.formState.isDirty)
        event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [submission.pending, form.formState.isDirty]);
  const submit = async () => {
    if (!session || busyRef.current) return;
    busyRef.current = true;
    const snapshot = { name: form.getValues('name'), id: project?.id };
    let saved: { data: SkillProject } | undefined;
    try {
      saved = await submission.run(snapshot, async (key, signal, input) => {
        setError(undefined);
        let valid = false;
        await form.handleSubmit(() => {
          valid = true;
        })();
        if (!valid) return;
        return api.request<{ data: SkillProject }>({
          path: input.id
            ? `skillProjects/${encodeURIComponent(input.id)}`
            : 'skillProjects',
          method: input.id ? 'PATCH' : 'POST',
          headers: { 'Idempotency-Key': key },
          signal,
          json: { name: input.name.trim() },
        });
      });
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiClientError && failure.status === 404) {
        setGone(true);
        reload();
      }
    } finally {
      busyRef.current = false;
    }
    if (saved) {
      busyRef.current = false;
      savedRef.current = true;
      onSaved(saved.data);
      toaster.show({
        type: 'success',
        title: t(project ? 'skillProjects.saved' : 'skillProjects.created', {
          name: saved.data.name,
        }),
      });
      await navigate({ pathname: '..', search: location.search });
    }
  };
  return (
    <RouteDialog
      title={t(project ? 'skillProjects.edit' : 'skillProjects.create')}
      className='sm:max-w-md'
      beforeClose={() =>
        !busyRef.current && !submission.submitting && !submission.pending
      }
      footer={
        <>
          <CancelButton
            disabled={submission.submitting || submission.pending}
          />
          <Button
            type='submit'
            form={formId}
            disabled={!session || submission.submitting || gone}
          >
            {t(
              submission.submitting
                ? 'skillProjects.saving'
                : project
                  ? 'skillProjects.save'
                  : 'skillProjects.createAction',
            )}
          </Button>
        </>
      }
    >
      <AlertDialog
        open={confirmDiscard}
        onOpenChange={(open) => {
          if (!open) decideDiscard(false);
        }}
      >
        <AlertDialogContent className='sm:max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('skillProjects.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('skillProjects.discardHint')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('skillProjects.keepEditing')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => decideDiscard(true)}>
              {t('skillProjects.discardAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <FeedbackForm
        id={formId}
        error={error}
        errorContent={
          gone
            ? t('skillProjects.gone')
            : submission.pending
              ? t('skillProjects.uncertain')
              : undefined
        }
        validationErrors={form.formState.errors}
        submitting={submission.submitting}
        onSubmit={async (event) => {
          event.preventDefault();
          await submit();
        }}
      >
        <fieldset
          disabled={submission.submitting || submission.pending || gone}
          className='flex flex-col gap-2'
        >
          <Label htmlFor={`${formId}-name`}>
            {t('skillProjects.name')} <span aria-hidden='true'>*</span>
          </Label>
          <Input
            id={`${formId}-name`}
            aria-required='true'
            aria-invalid={Boolean(form.formState.errors.name)}
            aria-describedby={
              form.formState.errors.name ? `${formId}-error` : undefined
            }
            {...form.register('name', {
              validate: (value) =>
                !value.trim()
                  ? t('skillProjects.required')
                  : value.trim().length > 100
                    ? t('skillProjects.tooLong')
                    : true,
            })}
          />
          {form.formState.errors.name ? (
            <p
              id={`${formId}-error`}
              data-feedback-field-error
              className='text-sm text-destructive'
            >
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </fieldset>
      </FeedbackForm>
    </RouteDialog>
  );
}
