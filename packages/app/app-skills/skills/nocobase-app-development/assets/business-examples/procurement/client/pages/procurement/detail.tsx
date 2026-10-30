import { useState, useRef, useId } from 'react';
import {
  useParams,
  useOutletContext,
  useNavigate,
  useLocation,
} from 'react-router';
import {
  useApiClient,
  useSubmission,
  createUuid,
  ApiClientError,
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
  ProcurementInput,
  amount,
  minorUnits,
  type ProcurementDetail,
} from '../../../shared/procurement.js';
import { Reference } from './reference.js';

export default function ProcurementDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  // Version changes remount the editor; operation feedback belongs to the route.
  const [failure, setFailure] = useState<{ id?: string; error: unknown }>();
  const request = useListData<{ data: ProcurementDetail }>(
    `procurement/${id}`,
    { active: !!id },
  );
  if (id && (!request.data || request.error))
    return (
      <RouteDrawer title={t('procurement.open')}>
        <p role='status'>
          {t(request.error ? 'procurement.failed' : 'procurement.loading')}
        </p>
        <Button onClick={request.reload}>{t('procurement.retry')}</Button>
      </RouteDrawer>
    );
  return (
    <Editor
      key={`${id ?? 'new'}:${request.data?.data.record.lifecycleVersion ?? 0}`}
      detail={request.data?.data}
      refresh={request.reload}
      refreshing={!!id && request.loading}
      error={failure?.id === id ? failure?.error : undefined}
      setError={(error) => setFailure({ id, error })}
    />
  );
}
function Editor({
  detail,
  refresh,
  refreshing,
  error,
  setError,
}: {
  detail?: ProcurementDetail;
  refresh: () => void;
  refreshing: boolean;
  error: unknown;
  setError: (error: unknown) => void;
}) {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const { session } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const { reload } = useOutletContext<{ reload: () => void }>();
  const formId = useId();
  const [title, setTitle] = useState(detail?.record.title ?? '');
  const [supplierId, setSupplierId] = useState(detail?.record.supplierId ?? '');
  const [reviewerId, setReviewerId] = useState(detail?.record.reviewerId ?? '');
  const [lines, setLines] = useState(
    (detail?.lines ?? []).map((l) => ({
      ...l,
      key: l.id,
      quantityText: String(l.quantity),
    })),
  );
  const [writing, setWriting] = useState(false);
  // A write is usable only after the refreshed version and actions reach the editor.
  const busy = writing || refreshing;
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const lockedRef = useRef(false);
  const editable = !detail || detail.actions.edit;
  const submission = useSubmission({
    scope: `${session?.user.id}:procurement:${detail?.record.id ?? 'new'}`,
  });
  const change = (update: () => void) => {
    update();
    setDirty(true);
    setDiscard(false);
  };
  const normalized = lines.map((l) => ({
    ...(l.id ? { id: l.id } : {}),
    materialId: l.materialId,
    quantity: Number(l.quantityText),
    unitPrice: l.unitPrice,
  }));
  let total = 0;
  let invalid = false;
  try {
    total = amount(normalized);
    if (
      normalized.some(
        (l) =>
          !Number.isInteger(l.quantity) ||
          l.quantity < 1 ||
          l.quantity > 100_000,
      )
    )
      invalid = true;
  } catch {
    invalid = true;
  }
  const save = async () => {
    if (lockedRef.current || refreshing) return;
    lockedRef.current = true;
    setWriting(true);
    setError(undefined);
    try {
      const result = await submission.run(
        {
          title,
          supplierId: supplierId || null,
          reviewerId: reviewerId || null,
          lines: normalized,
          totalMinor: total,
        },
        async (key, signal, input) => {
          const parsed = ProcurementInput.safeParse(input);
          if (!parsed.success || invalid) {
            setError(new Error(t('procurement.invalid')));
            return;
          }
          return api.request<{ data: { id: string } }>({
            path: detail ? `procurement/${detail.record.id}` : 'procurement',
            method: detail ? 'PATCH' : 'POST',
            headers: { 'Idempotency-Key': key },
            signal,
            json: {
              ...input,
              ...(detail ? { version: detail.record.lifecycleVersion } : {}),
            },
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
      if (e instanceof ApiClientError && e.status === 409) refresh();
    } finally {
      setWriting(false);
      lockedRef.current = false;
    }
  };
  const fire = async (transition: 'submit' | 'approve' | 'reject') => {
    if (!detail || lockedRef.current || refreshing || dirty) return;
    lockedRef.current = true;
    setWriting(true);
    setError(undefined);
    try {
      await api.request({
        path: `procurement/${detail.record.id}/fire`,
        method: 'POST',
        json: {
          transition,
          version: detail.record.lifecycleVersion,
          requestId: createUuid(),
        },
      });
      reload();
      refresh();
    } catch (e) {
      setError(e);
      if (e instanceof ApiClientError && e.status === 409) refresh();
    } finally {
      setWriting(false);
      lockedRef.current = false;
    }
  };
  const updateLine = (index: number, patch: Partial<(typeof lines)[number]>) =>
    change(() =>
      setLines((old) =>
        old.map((l, i) => (i === index ? { ...l, ...patch } : l)),
      ),
    );
  return (
    <RouteDrawer
      title={t(detail ? 'procurement.open' : 'procurement.new')}
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
          {editable ? (
            <Button type='submit' form={formId} disabled={busy || invalid}>
              {t('procurement.save')}
            </Button>
          ) : null}
          {detail?.actions.submit ? (
            <Button
              disabled={busy || dirty}
              onClick={() => void fire('submit')}
            >
              {t('procurement.submit')}
            </Button>
          ) : null}
          {detail?.actions.reject ? (
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => void fire('reject')}
            >
              {t('procurement.reject')}
            </Button>
          ) : null}
          {detail?.actions.approve ? (
            <Button disabled={busy} onClick={() => void fire('approve')}>
              {t('procurement.approve')}
            </Button>
          ) : null}
        </>
      }
    >
      {discard ? (
        <Alert>
          <AlertDescription>
            {t('procurement.discard')}{' '}
            <Button
              variant='outline'
              onClick={() => {
                setDirty(false);
                void navigate({ pathname: '..', search: location.search });
              }}
            >
              {t('procurement.discardAction')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {t('procurement.approvalHint')}
      </p>
      {detail ? (
        <p className='font-medium'>
          {t(`procurement.${detail.record.status}`)}
        </p>
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {t('procurement.quoteHint')}
      </p>
      <FeedbackForm
        id={formId}
        error={error}
        errorContent={
          error
            ? t(
                error instanceof ApiClientError && error.status === 409
                  ? 'procurement.changed'
                  : 'procurement.operationFailed',
              )
            : undefined
        }
        submitting={busy}
        onSubmit={async (e) => {
          e.preventDefault();
          await save();
        }}
      >
        <fieldset
          disabled={!editable || busy || submission.pending}
          className='space-y-5'
        >
          <div className='space-y-2'>
            <Label htmlFor={`${formId}-title`}>{t('procurement.name')}</Label>
            <Input
              id={`${formId}-title`}
              name='title'
              value={title}
              maxLength={160}
              onChange={(e) => change(() => setTitle(e.target.value))}
            />
          </div>
          <div className='grid gap-5 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>{t('procurement.supplier')}</Label>
              <Reference
                selectedName={detail?.supplierName ?? undefined}
                kind='suppliers'
                label={t('procurement.supplier')}
                value={supplierId}
                disabled={!editable}
                onChange={(v) => change(() => setSupplierId(v))}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('procurement.reviewer')}</Label>
              <Reference
                selectedName={detail?.reviewerName ?? undefined}
                kind='reviewers'
                label={t('procurement.reviewer')}
                value={reviewerId}
                disabled={!editable}
                onChange={(v) => change(() => setReviewerId(v))}
              />
            </div>
          </div>
          <p className='text-sm text-muted-foreground'>
            {t('procurement.referenceHint')}
          </p>
          <section aria-label={t('procurement.lines')} className='space-y-4'>
            <h2 className='font-semibold'>{t('procurement.lines')}</h2>
            {lines.map((line, i) => (
              <div key={line.key} className='space-y-3 rounded-lg border p-4'>
                <Reference
                  selectedName={line.materialName}
                  kind='materials'
                  label={`${t('procurement.material')} ${i + 1}`}
                  value={line.materialId}
                  disabled={!editable}
                  onChange={(id, option) =>
                    updateLine(i, {
                      materialId: id,
                      materialName: option?.name ?? id,
                      unitPrice: option?.unitPrice ?? line.unitPrice,
                      currentCatalogPriceMinor: option?.unitPrice
                        ? minorUnits(option.unitPrice)
                        : null,
                    })
                  }
                />
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-2'>
                    <Label htmlFor={`${formId}-q-${i}`}>
                      {t('procurement.quantity')}
                    </Label>
                    <Input
                      id={`${formId}-q-${i}`}
                      name={`lines.${i}.quantity`}
                      inputMode='numeric'
                      value={line.quantityText}
                      onChange={(e) =>
                        updateLine(i, { quantityText: e.target.value })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor={`${formId}-p-${i}`}>
                      {t('procurement.unitPrice')}
                    </Label>
                    <Input
                      id={`${formId}-p-${i}`}
                      name={`lines.${i}.unitPrice`}
                      inputMode='decimal'
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(i, { unitPrice: e.target.value })
                      }
                    />
                  </div>
                </div>
                <dl className='space-y-1 text-sm text-muted-foreground'>
                  <div className='flex flex-wrap justify-between gap-x-3'>
                    <dt>{t('procurement.catalogPrice')}</dt>
                    <dd>
                      <output aria-label={t('procurement.catalogPrice')}>
                        {line.currentCatalogPriceMinor === null
                          ? t('procurement.catalogUnavailable')
                          : (line.currentCatalogPriceMinor / 100).toFixed(2)}
                      </output>
                    </dd>
                  </div>
                  <div className='flex flex-wrap justify-between gap-x-3'>
                    <dt>{t('procurement.priceDifference')}</dt>
                    <dd>
                      <output aria-label={t('procurement.priceDifference')}>
                        {priceDifference(
                          line.unitPrice,
                          line.currentCatalogPriceMinor,
                        )}
                      </output>
                    </dd>
                  </div>
                </dl>
                {editable ? (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      change(() =>
                        setLines((old) => old.filter((_, n) => i !== n)),
                      )
                    }
                  >
                    {t('procurement.remove')}
                  </Button>
                ) : null}
              </div>
            ))}
            {editable ? (
              <Button
                type='button'
                variant='outline'
                disabled={lines.length >= 50}
                onClick={() =>
                  change(() =>
                    setLines((old) => [
                      ...old,
                      {
                        key: createUuid(),
                        id: '',
                        materialId: '',
                        materialName: '',
                        quantity: 1,
                        quantityText: '1',
                        unitPrice: '0.00',
                        unitPriceMinor: 0,
                        amountMinor: 0,
                        currentCatalogPriceMinor: null,
                      },
                    ]),
                  )
                }
              >
                {t('procurement.addLine')}
              </Button>
            ) : null}
          </section>
        </fieldset>
        {invalid ? (
          <p role='alert' className='text-sm text-destructive'>
            {t('procurement.invalid')}
          </p>
        ) : null}
        <div className='flex justify-between border-t pt-4 font-semibold'>
          <span>{t('procurement.total')}</span>
          <output aria-label={t('procurement.total')}>
            {invalid ? '—' : (total / 100).toFixed(2)}
          </output>
        </div>
      </FeedbackForm>
      {detail ? (
        <section className='space-y-3 border-t pt-4'>
          <h2 className='font-semibold'>{t('procurement.history')}</h2>
          <ol className='space-y-3 text-sm text-muted-foreground'>
            {detail.history.map((h) => (
              <li key={h.id}>
                {t('procurement.historyEntry', {
                  transition: t(
                    `procurement.${h.transition === '$create' ? 'created' : h.transition}`,
                  ),
                  from: h.from ? t(`procurement.${h.from}`) : '—',
                  to: t(`procurement.${h.to}`),
                  actor: h.actorName || h.actorId,
                  at: new Date(h.at).toLocaleString(i18n.language),
                })}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </RouteDrawer>
  );
}

function priceDifference(quote: string, reference: number | null) {
  if (reference === null) return '—';
  try {
    const difference = minorUnits(quote) - reference;
    return `${difference > 0 ? '+' : ''}${(difference / 100).toFixed(2)}`;
  } catch {
    return '—';
  }
}
