import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Button } from '../../components/ui/button.js';

const TEMPLATES = [
  'design',
  'large',
  'review',
  'routine',
  'small',
  'explanation',
] as const;

/** Shared by adding models and editing agents; choosing a template changes only the draft. */
export function GoodAtTemplates({
  value,
  onChange,
  disabled = false,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null>(null);
  return (
    <>
      <div
        className='flex flex-wrap gap-2'
        role='group'
        aria-label={t('goodAtTemplates.label')}
      >
        {TEMPLATES.map((key) => (
          <Button
            key={key}
            type='button'
            variant='outline'
            size='sm'
            disabled={disabled}
            onClick={() => {
              const next = t(`modelSuggestions.${key}`);
              if (value.trim()) setPending(next);
              else onChange(next);
            }}
          >
            {t(`goodAtTemplates.${key}`)}
          </Button>
        ))}
      </div>
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('goodAtTemplates.replaceTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('goodAtTemplates.replaceHint')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              type='button'
              disabled={disabled}
              onClick={() => {
                if (pending !== null) onChange(pending);
                setPending(null);
              }}
            >
              {t('goodAtTemplates.replace')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
