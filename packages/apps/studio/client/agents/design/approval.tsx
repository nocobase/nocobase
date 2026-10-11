import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type {
  DesignExecutorCandidate,
  DesignState,
} from '../../../shared/design.js';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { Empty, EmptyHeader, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
} from '@/components/ui/combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { useDesignDecision } from './api.js';

const keyOf = (candidate: DesignExecutorCandidate) =>
  `${candidate.type}:${candidate.id}`;

/** Both approval entry points share drafts, refreshed eligibility and conflict recovery. */
export function useDesignApproval(
  issueId: string,
  state: DesignState | undefined,
  onSuccess: () => void,
  focusFallback?: () => HTMLElement | null,
): {
  approve(comment: string): void;
  pending: boolean;
  /** The developer dialog is showing. */
  open: boolean;
  latest: DesignState | undefined;
  dialog: ReactElement;
} {
  const { t } = useTranslation();
  const api = useApiClient();
  const mutation = useDesignDecision(issueId);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    source: DesignState | undefined;
    issueId: string;
    data: DesignState;
  } | null>(null);
  const latest =
    snapshot && snapshot.source === state && snapshot.issueId === issueId
      ? snapshot.data
      : undefined;
  function setLatest(data: DesignState | undefined): void {
    setSnapshot(data ? { source: state, issueId, data } : null);
  }
  const [selected, setSelected] = useState<DesignExecutorCandidate | null>(
    null,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composingRef = useRef(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const busyRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const [terminalError, setTerminalError] = useState(false);
  const current = latest ?? state;
  const same = (
    candidate: DesignExecutorCandidate,
    value: DesignExecutorCandidate,
  ) => keyOf(candidate) === keyOf(value);

  function failureText(failure: unknown, fallback: string): string {
    if (!(failure instanceof ApiClientError) || !failure.reason)
      return fallback;
    return t(`errors.${failure.reason}`, { defaultValue: fallback });
  }

  async function refresh(defaultValue: boolean): Promise<DesignState | null> {
    setLoading(true);
    setLoadFailed(false);
    setTerminalError(false);
    setTerminalStatus(null);
    try {
      const next = (
        await api.request<{ data: DesignState }>({
          path: `designProposals/${encodeURIComponent(issueId)}`,
        })
      ).data;
      setLatest(next);
      if (defaultValue) {
        const initial =
          next.executorCandidates.find(
            (candidate) =>
              candidate.type === 'agent' &&
              candidate.id === next.recommendedAgentId,
          ) ??
          next.executorCandidates.find(
            (candidate) =>
              candidate.type === 'agent' &&
              candidate.id === 'studio-senior-developer',
          ) ??
          null;
        setSelected(initial);
        setSearch(initial?.name ?? '');
      } else {
        if (selected) {
          const eligible = next.executorCandidates.find((candidate) =>
            same(candidate, selected),
          );
          if (!eligible) setFieldError(t('design.executor.invalid'));
          setSelected(eligible ?? null);
        }
      }
      if (!next.canApprove) setError(t('design.executor.unavailable'));
      return next;
    } catch (failure) {
      setLoadFailed(true);
      if (
        failure instanceof ApiClientError &&
        [401, 403, 404].includes(failure.status)
      ) {
        setTerminalError(true);
        setTerminalStatus(failure.status);
        if (current)
          setLatest({
            ...current,
            canApprove: false,
            canRequestChanges: false,
          });
      }
      setError(
        failure instanceof ApiClientError &&
          [401, 403, 404].includes(failure.status)
          ? t(
              `design.executor.${failure.status === 401 ? 'sessionExpired' : failure.status === 403 ? 'forbidden' : 'notFound'}`,
            )
          : failureText(failure, t('design.executor.loadFailed')),
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function submit(
    value: DesignExecutorCandidate | null,
    draft: string,
    fromDialog: boolean,
  ): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setFieldError(null);
    try {
      const approved = await mutation.mutateAsync({
        decision: 'approve',
        comment: draft,
        ...(value ? { executor: { type: value.type, id: value.id } } : {}),
      });
      setLatest(approved);
      setOpen(false);
      setSelected(null);
      onSuccess();
    } catch (failure) {
      const required =
        failure instanceof ApiClientError &&
        failure.reason === 'DESIGN_EXECUTOR_REQUIRED';
      if (
        failure instanceof ApiClientError &&
        failure.reason === 'DESIGN_EXECUTOR_INVALID'
      ) {
        setFieldError(t('design.executor.invalid'));
        inputRef.current?.focus();
      } else setError(failureText(failure, t('common.requestFailed')));
      const next = await refresh(!fromDialog && required);
      if (required && next?.canApprove) {
        setComment(draft);
        setError(t('design.executor.changed'));
        setOpen(true);
      } else if (next && !next.canApprove && next.statusKey === 'in_progress') {
        setOpen(false);
        onSuccess();
      } else if (!fromDialog) setOpen(true);
    } finally {
      busyRef.current = false;
    }
  }

  function approve(draft: string): void {
    if (busyRef.current || loading) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setComment(draft);
    if (current?.executorOk) {
      void submit(null, draft, false);
      return;
    }
    setError(null);
    setSelected(null);
    setFieldError(null);
    setSearch('');
    setOpen(true);
    void refresh(true);
  }

  const groups = (['agent', 'user'] as const)
    .map((value) => ({
      value,
      items:
        current?.executorCandidates.filter(
          (candidate) => candidate.type === value,
        ) ?? [],
    }))
    .filter((group) => group.items.length > 0);
  const pending = mutation.isPending || loading;
  useEffect(() => {
    if (fieldError && !pending) inputRef.current?.focus();
  }, [fieldError, pending]);
  return {
    approve,
    pending,
    open,
    latest,
    dialog: (
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (busyRef.current || pending) return;
          setOpen(value);
          if (!value) {
            setSelected(null);
            setError(null);
          }
        }}
      >
        <DialogContent
          render={
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  !composingRef.current &&
                  !pending &&
                  !loadFailed &&
                  current?.canApprove &&
                  selected
                )
                  void submit(selected, comment, true);
              }}
            />
          }
          finalFocus={() =>
            openerRef.current?.isConnected
              ? openerRef.current
              : (focusFallback?.() ?? undefined)
          }
          className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md'
          showCloseButton={!pending}
        >
          <DialogHeader>
            <DialogTitle>{t('design.executor.title')}</DialogTitle>
            <DialogDescription>
              {t('design.executor.description')}
            </DialogDescription>
          </DialogHeader>
          <div className='flex min-h-0 flex-col gap-3 overflow-y-auto'>
            {loading ? (
              <div role='status' aria-label={t('common.loading')}>
                <Skeleton className='h-9 w-full' />
              </div>
            ) : null}
            {error ? (
              <Alert variant='destructive' id={`executor-error-${issueId}`}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {terminalStatus === 401 ? (
              <Button variant='outline' render={<Link to='/login' />}>
                {t('design.executor.signIn')}
              </Button>
            ) : null}
            {terminalStatus === 404 ? (
              <p>{t('design.executor.notFound')}</p>
            ) : null}
            <Field data-invalid={fieldError ? true : undefined}>
              <FieldLabel htmlFor={`executor-${issueId}`}>
                {t('design.executor.label')} *
              </FieldLabel>
              <Combobox
                items={groups}
                value={selected}
                onValueChange={(value) => {
                  setSelected(value);
                  setSearch(value?.name ?? '');
                  setFieldError(null);
                }}
                inputValue={search}
                onInputValueChange={setSearch}
                itemToStringLabel={(item: DesignExecutorCandidate) => item.name}
                isItemEqualToValue={same}
                disabled={pending || loadFailed || !current?.canApprove}
              >
                <ComboboxInput
                  ref={inputRef}
                  onCompositionStart={() => {
                    composingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    composingRef.current = false;
                  }}
                  aria-invalid={fieldError ? true : undefined}
                  id={`executor-${issueId}`}
                  className='w-full'
                  showClear
                  placeholder={t('design.executor.placeholder')}
                  clearLabel={t('design.executor.clear')}
                  triggerLabel={t('design.executor.search')}
                  aria-describedby={
                    error ? `executor-error-${issueId}` : undefined
                  }
                  aria-required='true'
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    {t('design.executor.noMatches')}
                    {search ? (
                      <Button variant='ghost' onClick={() => setSearch('')}>
                        {t('design.executor.clearSearch')}
                      </Button>
                    ) : null}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(group: {
                      value: 'agent' | 'user';
                      items: DesignExecutorCandidate[];
                    }) => (
                      <ComboboxGroup key={group.value} items={group.items}>
                        <ComboboxLabel>
                          {t(`design.executor.${group.value}`)}
                        </ComboboxLabel>
                        <ComboboxCollection>
                          {(candidate: DesignExecutorCandidate) => (
                            <ComboboxItem
                              key={keyOf(candidate)}
                              value={candidate}
                              className='items-start whitespace-normal break-words'
                            >
                              <span className='min-w-0 break-words'>
                                {candidate.name}
                                <span className='block text-xs text-muted-foreground'>
                                  {t(`design.executor.${candidate.type}`)}
                                </span>
                              </span>
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxGroup>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {selected ? (
                <p className='break-words text-sm'>{selected.name}</p>
              ) : null}
              {fieldError ? (
                <FieldError id={`executor-field-error-${issueId}`}>
                  {fieldError}
                </FieldError>
              ) : null}
            </Field>
            {!loading && current?.executorCandidates.length === 0 ? (
              <Empty className='p-2'>
                <EmptyHeader>
                  <EmptyDescription>
                    {t('design.executor.empty')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}
            {!terminalError ? (
              <Button
                variant='outline'
                disabled={pending}
                onClick={() => {
                  setError(null);
                  void refresh(false);
                }}
              >
                {t('design.executor.reload')}
              </Button>
            ) : null}
          </div>
          <DialogFooter className='shrink-0'>
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setSelected(null);
                setError(null);
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={
                pending || loadFailed || !selected || !current?.canApprove
              }
            >
              {mutation.isPending ? (
                <Loader2 className='size-4 animate-spin' aria-hidden='true' />
              ) : null}
              {t('design.executor.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  };
}
