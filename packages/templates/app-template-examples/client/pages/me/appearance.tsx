import { useAppLocale } from '@nocobase/app-plugin-i18n/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useTheme } from 'next-themes';
import { useId, type ReactElement, type ReactNode } from 'react';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Card, CardContent } from '#components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '#components/ui/field';
import { RadioGroup, RadioGroupItem } from '#components/ui/radio-group';

import { useLocaleChange } from '../../layouts/components/use-locale-change.js';
import { useThemePreset } from '../../theme/theme-context.js';
import { themePresets } from '../../theme/theme-presets.js';

const COLOR_MODES = ['light', 'dark', 'system'] as const;

/**
 * Language and appearance: the same preferences as the account menu's Language and Theme shortcuts, so a change in one
 * shows in the other. They belong to this browser and person; no permission applies.
 */
export default function AppearancePage(): ReactElement {
  const { t } = useTranslation();
  const { locale, locales, switching } = useAppLocale();
  const handleLocaleChange = useLocaleChange();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();

  return (
    <PageContainer>
      <PageHeader
        title={t('settings.personal.appearance.title')}
        description={t('settings.personal.appearance.description')}
      />
      <Card>
        <CardContent>
          <FieldGroup>
            {locales.length > 1 ? (
              <Choices
                legend={t('actions.language', { defaultValue: 'Language' })}
                value={locale}
                disabled={switching}
                onChange={handleLocaleChange}
                options={locales.map((definition) => ({
                  value: definition.locale,
                  label: definition.label,
                }))}
              />
            ) : null}
            <Choices
              legend={t('appearance.mode', { defaultValue: 'Color mode' })}
              value={theme ?? 'system'}
              onChange={(value) => setTheme(String(value))}
              options={COLOR_MODES.map((mode) => ({
                value: mode,
                label: t('appearance.' + mode, {
                  defaultValue: mode[0].toUpperCase() + mode.slice(1),
                }),
              }))}
            />
            <Choices
              legend={t('appearance.preset', { defaultValue: 'Theme' })}
              value={preset}
              onChange={(value) => {
                const selected = themePresets.find((item) => item.id === value);
                if (selected) setPreset(selected.id);
              }}
              options={themePresets.map((item) => ({
                value: item.id,
                label: t(item.labelKey, {
                  defaultValue:
                    item.id.charAt(0).toUpperCase() + item.id.slice(1),
                }),
              }))}
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

interface ChoicesProps {
  readonly legend: ReactNode;
  readonly value: string;
  readonly disabled?: boolean;
  readonly onChange: (value: unknown) => void;
  readonly options: readonly { value: string; label: ReactNode }[];
}

function Choices({
  legend,
  value,
  disabled,
  onChange,
  options,
}: ChoicesProps): ReactElement {
  const id = useId();
  return (
    <FieldSet>
      <FieldLegend variant='label'>{legend}</FieldLegend>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className='flex flex-wrap gap-x-6 gap-y-2'
      >
        {options.map((option) => (
          <Field key={option.value} orientation='horizontal' className='w-auto'>
            <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
            <FieldLabel
              htmlFor={`${id}-${option.value}`}
              className='font-normal'
            >
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  );
}
