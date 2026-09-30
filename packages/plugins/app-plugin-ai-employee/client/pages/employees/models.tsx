import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { useId, type ReactElement } from 'react';
import { Field, FieldLabel } from '../../components/ui/field.js';
import { Switch } from '../../components/ui/switch.js';
import { useT } from '../../locales/index.js';
import { useEmployeeEditor } from './employee-context.js';
import { EmployeeMultiSelect } from './multi-select.js';

export default function EmployeeModelsPage(): ReactElement {
  const { draft, models, saving, patchDraft } = useEmployeeEditor();
  const t = useT();
  const id = useId();
  const selectedModels = draft.modelSettings.models ?? [];
  return (
    <div className='space-y-5'>
      <Alert role='note'>
        <CircleAlert aria-hidden='true' />
        <AlertDescription>
          {t('Restrict this AI employee to the selected models.')}
        </AlertDescription>
      </Alert>
      <Field orientation='horizontal' className='w-fit'>
        <Switch
          id={`${id}-enabled`}
          checked={draft.modelSettings.enabled === true}
          disabled={saving}
          onCheckedChange={(enabled) =>
            patchDraft({ modelSettings: { ...draft.modelSettings, enabled } })
          }
        />
        <FieldLabel htmlFor={`${id}-enabled`}>
          {t('Enable dedicated model configuration')}
        </FieldLabel>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-models`}>{t('Models')}</FieldLabel>
        <EmployeeMultiSelect
          disabled={saving || draft.modelSettings.enabled !== true}
          id={`${id}-models`}
          options={models.map((model) => ({
            value: `${model.llmService}::${model.model}`,
            label: model.label,
            group: model.serviceTitle,
          }))}
          value={[
            ...new Set(
              selectedModels.map((item) => `${item.llmService}::${item.model}`),
            ),
          ]}
          placeholder={t('Select models')}
          removeLabel={t('Remove')}
          emptyLabel={t('None configured.')}
          onChange={(values) => {
            if (saving || draft.modelSettings.enabled !== true) return;
            const available = new Map(
              [...selectedModels, ...models].map((model) => [
                `${model.llmService}::${model.model}`,
                model,
              ]),
            );
            const next = values.flatMap((key) => {
              const model = available.get(key);
              return model
                ? [{ llmService: model.llmService, model: model.model }]
                : [];
            });
            patchDraft({
              modelSettings: {
                ...draft.modelSettings,
                llmService: undefined,
                model: undefined,
                models: next,
              },
            });
          }}
        />
      </Field>
    </div>
  );
}
