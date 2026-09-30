import { CircleAlert } from 'lucide-react';
import { useId, type ReactElement } from 'react';
import { buildEditableValues } from '../../ai-employee-service.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../components/ui/field.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useT } from '../../locales/index.js';
import { useEmployeeEditor } from './employee-context.js';

export default function EmployeeRolePage(): ReactElement {
  const {
    selected,
    draft,
    saving,
    customRoleMode,
    setCustomRoleMode,
    patchDraft,
  } = useEmployeeEditor();
  const t = useT();
  const id = useId();
  const useCustomRole = customRoleMode ?? draft.about != null;
  return (
    <div className='flex h-full min-h-80 flex-col gap-4'>
      <Alert role='note'>
        <CircleAlert aria-hidden='true' />
        <AlertDescription>{t('Role setting description')}</AlertDescription>
      </Alert>
      {selected.builtIn ? (
        <FieldSet className='min-h-0 min-w-0 flex-1 gap-3' disabled={saving}>
          <FieldLegend variant='label'>{t('Role settings')}</FieldLegend>
          <RadioGroup
            aria-label={t('Role settings')}
            className='flex items-center gap-6'
            value={useCustomRole ? 'custom' : 'default'}
            disabled={saving}
            onValueChange={(value) => {
              if (saving) return;
              const custom = value === 'custom';
              setCustomRoleMode(custom);
              patchDraft({
                about: custom
                  ? (draft.about ?? buildEditableValues(selected).about)
                  : null,
              });
            }}
          >
            <Field orientation='horizontal' className='w-fit'>
              <RadioGroupItem id={`${id}-default`} value='default' />
              <FieldLabel htmlFor={`${id}-default`} className='font-normal'>
                {t('System default')}
              </FieldLabel>
            </Field>
            <Field orientation='horizontal' className='w-fit'>
              <RadioGroupItem id={`${id}-custom`} value='custom' />
              <FieldLabel htmlFor={`${id}-custom`} className='font-normal'>
                {t('Custom')}
              </FieldLabel>
            </Field>
          </RadioGroup>
          {!useCustomRole ? (
            <pre className='min-h-0 w-full flex-1 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm'>
              {selected.defaultPrompt ?? ''}
            </pre>
          ) : (
            <Textarea
              aria-label={t('Role settings')}
              placeholder={t('employees.rolePlaceholder')}
              disabled={saving}
              value={draft.about ?? ''}
              onChange={(event) =>
                patchDraft({
                  about:
                    event.target.value === '' &&
                    buildEditableValues(selected).about === null
                      ? null
                      : event.target.value,
                })
              }
              className='min-h-0 w-full flex-1 resize-none overflow-auto'
            />
          )}
        </FieldSet>
      ) : (
        <Field className='min-h-0 flex-1'>
          <FieldLabel htmlFor={`${id}-about`}>{t('Role settings')}</FieldLabel>
          <Textarea
            id={`${id}-about`}
            disabled={saving}
            value={draft.about ?? ''}
            onChange={(event) => patchDraft({ about: event.target.value })}
            className='min-h-0 w-full flex-1 resize-none overflow-auto'
            placeholder={t('employees.rolePlaceholder')}
          />
        </Field>
      )}
    </div>
  );
}
