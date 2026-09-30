import { CircleAlert } from 'lucide-react';
import { useId, type ReactElement } from 'react';
import { hasKnowledgeBaseDataPlaceholder } from '../../ai-employee-service.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import { Switch } from '../../components/ui/switch.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useT } from '../../locales/index.js';
import { useEmployeeEditor } from './employee-context.js';
import { EmployeeMultiSelect } from './multi-select.js';

export default function EmployeeKnowledgePage(): ReactElement {
  const { selected, draft, knowledgeBases, saving, patchDraft } =
    useEmployeeEditor();
  const t = useT();
  const id = useId();
  const disabled = saving || !draft.enableKnowledgeBase;
  const promptValid =
    !draft.enableKnowledgeBase ||
    hasKnowledgeBaseDataPlaceholder(draft.knowledgeBasePrompt);
  return (
    <div className='space-y-5'>
      <Field orientation='horizontal' className='w-fit'>
        <Switch
          id={`${id}-enabled`}
          checked={draft.enableKnowledgeBase}
          disabled={saving}
          onCheckedChange={(enableKnowledgeBase) =>
            patchDraft({ enableKnowledgeBase })
          }
        />
        <FieldLabel htmlFor={`${id}-enabled`}>
          {t('Enable Knowledge Base')}
        </FieldLabel>
      </Field>
      {selected.missingKnowledgeBaseKeys?.length ? (
        <Alert role='status'>
          <CircleAlert aria-hidden='true' />
          <AlertDescription>
            {t('Missing Knowledge Bases')}:{' '}
            {selected.missingKnowledgeBaseKeys.join(', ')}
          </AlertDescription>
        </Alert>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`${id}-bases`}>{t('Knowledge Base')}</FieldLabel>
        <EmployeeMultiSelect
          disabled={disabled}
          emptyLabel={t('No enabled knowledge bases.')}
          id={`${id}-bases`}
          options={knowledgeBases.map((option) => ({
            value: option.key,
            label: option.name,
          }))}
          placeholder={t('Leave blank to retrieve from all knowledge bases')}
          removeLabel={t('Remove')}
          value={draft.knowledgeBase.knowledgeBaseKeys ?? []}
          onChange={(knowledgeBaseKeys) => {
            if (!disabled)
              patchDraft({
                knowledgeBase: { ...draft.knowledgeBase, knowledgeBaseKeys },
              });
          }}
        />
        <FieldDescription>
          {t(
            'Actual retrieval is limited to knowledge bases accessible to the roles of the user using this AI employee. Inaccessible knowledge bases are excluded.',
          )}
        </FieldDescription>
      </Field>
      <FieldSet className='gap-3' disabled={disabled}>
        <FieldLegend variant='label'>{t('Retrieval strategy')}</FieldLegend>
        <RadioGroup
          aria-label={t('Retrieval strategy')}
          value={draft.knowledgeBase.retrievalStrategy}
          disabled={disabled}
          onValueChange={(value: unknown) => {
            if (!disabled && (value === 'onDemand' || value === 'always')) {
              patchDraft({
                knowledgeBase: {
                  ...draft.knowledgeBase,
                  retrievalStrategy: value,
                },
              });
            }
          }}
        >
          <Field orientation='horizontal'>
            <RadioGroupItem id={`${id}-on-demand`} value='onDemand' />
            <FieldContent>
              <FieldLabel htmlFor={`${id}-on-demand`} className='font-normal'>
                {t('Retrieve on demand')}
              </FieldLabel>
              <FieldDescription>
                {t(
                  'The AI employee retrieves knowledge-base content only when it determines that it is needed.',
                )}
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation='horizontal'>
            <RadioGroupItem id={`${id}-always`} value='always' />
            <FieldContent>
              <FieldLabel htmlFor={`${id}-always`} className='font-normal'>
                {t('Automatically retrieve for every question')}
              </FieldLabel>
              <FieldDescription>
                {t(
                  'Retrieve before every user question, then answer with the retrieved content.',
                )}
              </FieldDescription>
            </FieldContent>
          </Field>
        </RadioGroup>
      </FieldSet>
      <Field data-invalid={!promptValid || undefined}>
        <FieldLabel htmlFor={`${id}-prompt`}>
          {t('Knowledge Base Prompt')}
        </FieldLabel>
        <Textarea
          id={`${id}-prompt`}
          disabled={disabled}
          value={draft.knowledgeBasePrompt}
          onChange={(event) => {
            if (!disabled)
              patchDraft({ knowledgeBasePrompt: event.target.value });
          }}
          aria-invalid={!promptValid}
          className='min-h-28'
        />
        {!promptValid ? (
          <FieldError>
            {t('Knowledge Base Prompt must include {knowledgeBaseData}.')}
          </FieldError>
        ) : null}
      </Field>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field>
          <FieldLabel htmlFor={`${id}-top-k`}>Top K</FieldLabel>
          <Input
            id={`${id}-top-k`}
            type='number'
            min={1}
            disabled={disabled}
            value={draft.knowledgeBase.topK ?? 5}
            onChange={(event) => {
              if (!disabled)
                patchDraft({
                  knowledgeBase: {
                    ...draft.knowledgeBase,
                    topK: Number(event.target.value),
                  },
                });
            }}
          />
          <FieldDescription>
            {t(
              'Maximum number of knowledge-base entries returned for each retrieval.',
            )}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-score`}>{t('Score')}</FieldLabel>
          <Input
            id={`${id}-score`}
            type='number'
            min={0}
            max={1}
            step={0.01}
            disabled={disabled}
            value={draft.knowledgeBase.score ?? 0.5}
            onChange={(event) => {
              if (!disabled)
                patchDraft({
                  knowledgeBase: {
                    ...draft.knowledgeBase,
                    score: Number(event.target.value),
                  },
                });
            }}
          />
          <FieldDescription>
            {t(
              'Minimum similarity score for knowledge-base content to be included in retrieval results.',
            )}
          </FieldDescription>
        </Field>
      </div>
    </div>
  );
}
