import { useState, type ReactElement, type ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';
import { Button } from './components.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components.js';
import { Spinner } from '../components/ui/spinner.js';
import {
  useErrorText,
  useT,
  type Confirmation,
  type DraftControls,
} from './context.js';

export function ErrorAlert({
  error,
  action,
}: {
  readonly error: unknown;
  readonly action?: ReactNode;
}): ReactElement | null {
  const text = useErrorText();
  if (!error) return null;
  return (
    <Alert variant='destructive'>
      <AlertTitle>{text(error)}</AlertTitle>
      {action ? <AlertDescription>{action}</AlertDescription> : null}
    </Alert>
  );
}

/**
 * A settings card: what it controls, its fields, and its own save bar. A save that changes what visitors can do asks
 * first, listing the changes.
 */
export function SettingsCard({
  title,
  description,
  draft,
  canEdit,
  busy,
  confirmation,
  children,
}: {
  readonly title: string;
  readonly description: ReactNode;
  readonly draft?: DraftControls;
  readonly canEdit?: boolean;
  readonly busy?: boolean;
  /** Asked before saving; `undefined` saves at once. */
  readonly confirmation?: Confirmation;
  readonly children: ReactNode;
}): ReactElement {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const save = async () => {
    if (draft && (await draft.save())) setConfirming(false);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {draft?.conflict ? (
          <Alert variant='destructive'>
            <AlertTitle>{t('errors.conflict')}</AlertTitle>
            <AlertDescription>
              <Button type='button' variant='outline' onClick={draft.discard}>
                {t('discardAndReload')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {draft && !confirming ? <ErrorAlert error={draft.error} /> : null}
        {children}
      </CardContent>
      {draft && canEdit ? (
        <CardFooter className='justify-end gap-2 border-t'>
          {draft.dirty ? (
            <span className='mr-auto text-sm text-muted-foreground'>
              {t('unsaved')}
            </span>
          ) : null}
          <Button
            type='button'
            variant='outline'
            disabled={!draft.dirty || draft.saving}
            onClick={draft.discard}
          >
            {t('cancel')}
          </Button>
          <Button
            type='button'
            disabled={!draft.dirty || draft.saving || draft.conflict || busy}
            onClick={() =>
              confirmation ? setConfirming(true) : void draft.save()
            }
          >
            {draft.saving && !confirming ? <Spinner /> : null}
            {t('save')}
          </Button>
        </CardFooter>
      ) : null}
      {draft && confirmation ? (
        <AlertDialog
          open={confirming}
          onOpenChange={(open) => {
            if (!draft.saving) setConfirming(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmation.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmation.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {confirmation.changes.length ? (
              <ul className='grid list-disc gap-1 pl-5 text-sm'>
                {confirmation.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            ) : null}
            <ErrorAlert error={draft.error} />
            <AlertDialogFooter>
              <Button
                variant='outline'
                disabled={draft.saving}
                onClick={() => setConfirming(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                variant={confirmation.destructive ? 'destructive' : 'default'}
                disabled={draft.saving || busy}
                onClick={() => void save()}
              >
                {draft.saving ? <Spinner /> : null}
                {t('apply')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </Card>
  );
}

/** A labelled row: the control on the right, its explanation under the label. */
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: {
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly htmlFor?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0 flex-1'>
        <label htmlFor={htmlFor} className='text-sm font-medium'>
          {label}
        </label>
        {description ? (
          <p className='mt-0.5 text-sm break-words text-muted-foreground'>
            {description}
          </p>
        ) : null}
      </div>
      <div className='shrink-0 sm:max-w-[60%]'>{children}</div>
    </div>
  );
}
