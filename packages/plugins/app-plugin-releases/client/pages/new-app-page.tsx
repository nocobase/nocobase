/**
 * Create App, at `apps/new` below an environment's page: a route dialog over the environment, so a link opens it and a
 * refresh keeps it. The App goes to that environment, which the form shows but does not offer to change. Creating one
 * opens the new App's page in place of the dialog.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';

import type { EnvironmentRecord } from '../../shared/releases.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { AdvancedSection } from '../components/advanced-section.js';
import { LabelsEditor } from '../components/labels-editor.js';
import { RouteDialog } from '../components/route-dialog.js';
import { RuntimePolicyFields } from '../components/runtime-policy-fields.js';
import { Button } from '../components/ui/button.js';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '../components/ui/field.js';
import { Input } from '../components/ui/input.js';
import { Spinner } from '../components/ui/spinner.js';
import { useRouteOverlay } from '../components/use-route-overlay.js';
import { useNotify } from '../hooks/use-notify.js';
import { useLoad, useReleasesApi } from '../hooks/use-releases.js';
import {
  countLabels,
  labelRowErrors,
  labelsOf,
  type LabelRow,
} from '../lib/labels.js';
import { useReleasesLinks } from '../lib/paths.js';
import {
  DEFAULT_POLICY_DRAFT,
  parsePolicyDraft,
  policySummary,
  type RuntimePolicyDraft,
} from '../lib/runtime-policy.js';

/** What the page under the dialog hands it: the environment's page for Create App, the Apps page for a request. */
export interface AppsOutletContext {
  /** Loads the list again once an App is created or a request decided. */
  readonly reload: () => void;
  /** Loads the requests waiting for the caller again once one is decided (`request-page.tsx`). */
  readonly reloadRequests?: () => void;
}

const FORM_ID = 'rel-create-app';

export default function NewAppPage(): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const links = useReleasesLinks();
  const { environmentId = '' } = useParams();
  // The page under the dialog may hand nothing (an application routing it itself); then nothing is reloaded.
  const context = useOutletContext<AppsOutletContext | undefined>();
  const environment = useLoad(
    () => api.get<EnvironmentRecord>(`environments/${environmentId}`),
    `environment:${environmentId}`,
  );
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [policy, setPolicy] =
    useState<RuntimePolicyDraft>(DEFAULT_POLICY_DRAFT);
  const [timerModes, setTimerModes] = useState<{
    idle: 'inherit' | 'custom';
    dormant: 'inherit' | 'custom';
  }>({ idle: 'inherit', dormant: 'inherit' });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const effectivePolicyDraft = {
    ...policy,
    idleStopMinutes:
      timerModes.idle === 'inherit' ? '' : policy.idleStopMinutes,
    dormantAfterHours:
      timerModes.dormant === 'inherit' ? '' : policy.dormantAfterHours,
  };
  const parsedPolicy = parsePolicyDraft(effectivePolicyDraft);
  const labelsValid = labelRowErrors(labels).size === 0;
  const labelCount = countLabels(labels);
  const advancedSummary = [
    parsedPolicy.policy &&
    (parsedPolicy.policy.activation !== 'eager' ||
      parsedPolicy.policy.idleStopMinutes !== null ||
      parsedPolicy.policy.dormantAfterHours !== null)
      ? policySummary(t, parsedPolicy.policy)
      : null,
    labelCount ? t('ui.labels.count', { count: labelCount }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const selected = environment.data?.id ?? null;

  const setSubmitting = (next: boolean): void => {
    busyRef.current = next;
    setBusy(next);
  };

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selected || !parsedPolicy.policy || !labelsValid) return;
    setSubmitting(true);
    try {
      const created = id.trim();
      await api.send('POST', 'apps', {
        id: created,
        name: name.trim(),
        environmentId: selected,
        labels: labelsOf(labels),
        activation: parsedPolicy.policy.activation,
        ...(timerModes.idle === 'custom'
          ? { idleStopMinutes: parsedPolicy.policy.idleStopMinutes }
          : {}),
        ...(timerModes.dormant === 'custom'
          ? { dormantAfterHours: parsedPolicy.policy.dormantAfterHours }
          : {}),
      });
      notify.success(t('ui.apps.created', { name: name.trim() }));
      setSubmitting(false);
      context?.reload();
      // The new App replaces the dialog, so going back returns to the environment.
      void navigate(links.app(created), { replace: true });
    } catch (reason) {
      notify.error(reason);
      setSubmitting(false);
    }
  };

  return (
    <RouteDialog
      title={t('ui.apps.create')}
      description={t('ui.apps.createDescription')}
      beforeClose={() => !busyRef.current}
      footer={
        <NewAppFooter
          busy={busy}
          disabled={
            busy ||
            !selected ||
            !id.trim() ||
            !name.trim() ||
            !parsedPolicy.policy ||
            !labelsValid
          }
        />
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void submit(event)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='rel-app-name'>{t('ui.apps.name')}</FieldLabel>
            <Input
              id='rel-app-name'
              value={name}
              autoFocus
              required
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='rel-app-id'>{t('ui.apps.id')}</FieldLabel>
            <Input
              id='rel-app-id'
              value={id}
              required
              disabled={busy}
              className='font-mono'
              placeholder='website'
              onChange={(event) => setId(event.target.value)}
            />
            <FieldDescription>{t('ui.apps.idHint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='rel-app-environment'>
              {t('ui.apps.environment')}
            </FieldLabel>
            {/* Fixed: the App is created from this environment's page. */}
            <Input
              id='rel-app-environment'
              value={environment.data?.name ?? environmentId}
              readOnly
              disabled
            />
          </Field>
          <AdvancedSection summary={advancedSummary || null}>
            <RuntimePolicyFields
              value={policy}
              onChange={setPolicy}
              timerModes={timerModes}
              onTimerModesChange={setTimerModes}
            />
            <Field>
              <FieldLabel>{t('ui.apps.labels')}</FieldLabel>
              <LabelsEditor rows={labels} onChange={setLabels} />
            </Field>
          </AdvancedSection>
        </FieldGroup>
      </form>
    </RouteDialog>
  );
}

/** Inside the dialog, so Cancel closes this layer. */
function NewAppFooter({
  busy,
  disabled,
}: {
  readonly busy: boolean;
  readonly disabled: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const { close, isClosing } = useRouteOverlay();
  return (
    <>
      <Button
        variant='outline'
        disabled={busy || isClosing}
        onClick={() => void close()}
      >
        {t('ui.confirm.cancel')}
      </Button>
      <Button type='submit' form={FORM_ID} disabled={disabled}>
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t('ui.apps.create')}
      </Button>
    </>
  );
}
