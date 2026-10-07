/**
 * An App's runtime policy and labels, on its Settings tab: a card saved on its own. Labels the assembling application
 * added stay as they are and show read-only; the rest are edited as rows. A policy change reaches the runtime without
 * restarting the App.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type FormEvent, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { AppSummary } from '../../shared/releases.js';
import { useNotify } from '../hooks/use-notify.js';
import { useReleasesApi } from '../hooks/use-releases.js';
import {
  labelRowErrors,
  labelsOf,
  newLabelRow,
  type LabelRow,
} from '../lib/labels.js';
import {
  parsePolicyDraft,
  policyDraft,
  type RuntimePolicyDraft,
} from '../lib/runtime-policy.js';
import { useSystemLabels } from '../lib/system-labels.js';
import { LabelsEditor } from './labels-editor.js';
import { RuntimePolicyFields } from './runtime-policy-fields.js';
import { Button } from './ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card.js';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from './ui/field.js';
import { Spinner } from './ui/spinner.js';

export function AppSettingsCard({
  summary,
  onSaved,
}: {
  readonly summary: AppSummary;
  readonly onSaved: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const systemOf = useSystemLabels();
  const system = systemOf(summary.app.labels);
  const initialRows = (): LabelRow[] =>
    Object.entries(summary.app.labels)
      .filter(([key]) => !(key in system))
      .map(([key, value]) => newLabelRow(key, value));
  const [policy, setPolicy] = useState<RuntimePolicyDraft>(() =>
    policyDraft(summary.app),
  );
  const [rows, setRows] = useState<LabelRow[]>(initialRows);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const parsed = parsePolicyDraft(policy);
  const labelsValid = labelRowErrors(rows, Object.keys(system)).size === 0;

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!parsed.policy || !labelsValid) return;
    setBusy(true);
    try {
      await api.send('PATCH', `apps/${summary.app.id}`, {
        ...parsed.policy,
        labels: { ...labelsOf(rows), ...system },
      });
      notify.success(t('ui.settings.saved'));
      setDirty(false);
      onSaved();
    } catch (reason) {
      notify.error(reason);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card data-slot='app-settings'>
      <CardHeader>
        <CardTitle>{t('ui.settings.edit')}</CardTitle>
        <CardDescription>{t('ui.settings.editDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form id='rel-app-settings' onSubmit={(event) => void submit(event)}>
          <FieldGroup>
            <RuntimePolicyFields
              value={policy}
              onChange={(next) => {
                setPolicy(next);
                setDirty(true);
              }}
            />
            <FieldSeparator />
            <Field>
              <FieldLabel>{t('ui.apps.labels')}</FieldLabel>
              <LabelsEditor
                rows={rows}
                onChange={(next) => {
                  setRows(next);
                  setDirty(true);
                }}
                systemLabels={system}
              />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        {dirty ? (
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => {
              setPolicy(policyDraft(summary.app));
              setRows(initialRows());
              setDirty(false);
            }}
          >
            {t('ui.config.discard')}
          </Button>
        ) : null}
        <Button
          type='submit'
          form='rel-app-settings'
          disabled={busy || !dirty || !parsed.policy || !labelsValid}
        >
          {busy ? <Spinner data-icon='inline-start' /> : null}
          {t('ui.settings.save')}
        </Button>
      </CardFooter>
    </Card>
  );
}
