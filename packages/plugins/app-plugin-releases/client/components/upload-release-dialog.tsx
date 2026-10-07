/**
 * What a release uploaded from the App page carries besides its archive: an optional commit (the `sha` label, which
 * the assembling application may read, as a CI upload's `--label sha=<commit>` sets it) and, under "Advanced
 * (optional)", other labels as rows of a name and a value. The labels travel in the `X-Release-Labels` header as JSON, with every non-ASCII character escaped so that a header
 * can carry it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type FormEvent, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { uploadLabels } from '../lib/format.js';
import { AdvancedSection } from './advanced-section.js';
import {
  countLabels,
  labelRowErrors,
  labelsOf,
  type LabelRow,
} from '../lib/labels.js';
import { LabelsEditor } from './labels-editor.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Field, FieldDescription, FieldGroup, FieldLabel } from './ui/field.js';
import { Input } from './ui/input.js';

export function UploadReleaseDialog({
  file,
  onCancel,
  onUpload,
}: {
  /** The archive chosen; the dialog is open while there is one. */
  readonly file: File | null;
  readonly onCancel: () => void;
  readonly onUpload: (file: File, labels: Record<string, string>) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [commit, setCommit] = useState('');
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const commitValid =
    commit.trim() === '' || /^[0-9a-f]{7,64}$/iu.test(commit.trim());
  const labelsValid = labelRowErrors(labels).size === 0;
  const labelCount = countLabels(labels);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (!file || !commitValid || !labelsValid) return;
    onUpload(file, uploadLabels(commit.toLowerCase(), labelsOf(labels)));
    setCommit('');
    setLabels([]);
  };

  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('ui.releases.upload')}</DialogTitle>
          <DialogDescription className='wrap-anywhere'>
            {file?.name}
          </DialogDescription>
        </DialogHeader>
        <form
          id='rel-upload-release'
          className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4 py-1'
          onSubmit={submit}
        >
          <FieldGroup>
            <Field data-invalid={!commitValid || undefined}>
              <FieldLabel htmlFor='rel-release-commit'>
                {t('ui.releases.commit')}
              </FieldLabel>
              <Input
                id='rel-release-commit'
                value={commit}
                autoFocus
                className='font-mono'
                placeholder='a1b2c3d'
                aria-invalid={!commitValid || undefined}
                onChange={(event) => setCommit(event.target.value)}
              />
              <FieldDescription>{t('ui.releases.commitHint')}</FieldDescription>
            </Field>
            <AdvancedSection
              summary={
                labelCount ? t('ui.labels.count', { count: labelCount }) : null
              }
            >
              <Field>
                <FieldLabel>{t('ui.apps.labels')}</FieldLabel>
                <LabelsEditor rows={labels} onChange={setLabels} />
              </Field>
            </AdvancedSection>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            {t('ui.confirm.cancel')}
          </Button>
          <Button
            type='submit'
            form='rel-upload-release'
            disabled={!commitValid || !labelsValid}
          >
            {t('ui.releases.uploadAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
