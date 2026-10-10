import { useTranslation } from '@nocobase/i18n/client';
import { CheckCircle2Icon } from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';

import { ExamplePage, ExampleSection } from '../shared';

const ROLE_CHOICES = ['operations', 'finance', 'support'] as const;
const GOAL_CHOICES = ['fulfilment', 'errors', 'reporting', 'cost'] as const;
const SOURCE_CHOICES = [
  'search',
  'partner',
  'conference',
  'colleague',
] as const;
const REMINDER_CHOICES = ['daily', 'weekly', 'never'] as const;
const FORMAT_CHOICES = ['csv', 'pdf', 'dashboard'] as const;

const SURVEY_ITEMS = [
  {
    name: 'role',
    required: true,
    choices: ROLE_CHOICES.map((value) => ({ value })),
  },
  { name: 'goals', choices: GOAL_CHOICES.map((value) => ({ value })) },
  { name: 'tools' },
];

const SOURCE_ITEMS = [
  {
    name: 'source',
    required: true,
    choices: SOURCE_CHOICES.map((value) => ({ value })),
  },
];

const PREFERENCE_ITEMS = [
  {
    name: 'reminders',
    required: true,
    choices: REMINDER_CHOICES.map((value) => ({ value })),
  },
  {
    name: 'format',
    required: true,
    choices: FORMAT_CHOICES.map((value) => ({ value })),
  },
];

/** FormData entries may be files; only text answers are meaningful here. */
function readText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

interface SurveyAnswers {
  readonly role: string;
  readonly goals: readonly string[];
  readonly tools: string;
}

export default function QuestionnaireExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<SurveyAnswers | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const handleSurveySubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setAnswers({
      role: readText(formData.get('role')),
      goals: formData.getAll('goals').map(readText).filter(Boolean),
      tools: readText(formData.get('tools')),
    });
  };

  const handleSourceSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSource(readText(formData.get('source')));
  };

  return (
    <ExamplePage
      title={t('components.questionnaire.title')}
      description={t('components.questionnaire.description')}
      docs='https://ui.shadcn.com/docs/components/questionnaire'
    >
      <ExampleSection
        title={t('components.questionnaire.onboarding')}
        description={t('components.questionnaire.onboardingDescription')}
        contentClassName='block'
      >
        {answers ? (
          <div className='max-w-md space-y-3'>
            <p className='flex items-center gap-2 font-medium'>
              <CheckCircle2Icon className='size-4 text-primary' />
              {t('components.questionnaire.completedTitle')}
            </p>
            <dl className='space-y-1.5 text-sm'>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>
                  {t('components.questionnaire.role.legend')}
                </dt>
                <dd className='text-right'>
                  {t(`components.questionnaire.role.${answers.role}.label`)}
                </dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>
                  {t('components.questionnaire.goals.legend')}
                </dt>
                <dd className='text-right'>
                  {answers.goals.length > 0
                    ? answers.goals
                        .map((goal) =>
                          t(`components.questionnaire.goals.${goal}.label`),
                        )
                        .join(' · ')
                    : t('reference.none')}
                </dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>
                  {t('components.questionnaire.tools.legend')}
                </dt>
                <dd className='text-right'>
                  {answers.tools || t('reference.none')}
                </dd>
              </div>
            </dl>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setAnswers(null)}
            >
              {t('components.questionnaire.startOver')}
            </Button>
          </div>
        ) : (
          <Questionnaire
            className='max-w-md'
            defaultItem='role'
            items={SURVEY_ITEMS}
            onSubmit={handleSurveySubmit}
          >
            <QuestionnaireProgress />

            <QuestionnaireItem name='role' required>
              <QuestionnaireTitle>
                {t('components.questionnaire.role.title')}
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                {t('components.questionnaire.role.description')}
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                {ROLE_CHOICES.map((value) => (
                  <QuestionnaireChoice key={value} value={value}>
                    <span className='font-medium'>
                      {t(`components.questionnaire.role.${value}.label`)}
                    </span>
                    <QuestionnaireChoiceDescription>
                      {t(`components.questionnaire.role.${value}.hint`)}
                    </QuestionnaireChoiceDescription>
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name='goals' multiple>
              <QuestionnaireTitle>
                {t('components.questionnaire.goals.title')}
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                {t('components.questionnaire.goals.description')}
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                {GOAL_CHOICES.map((value) => (
                  <QuestionnaireChoice key={value} value={value}>
                    {t(`components.questionnaire.goals.${value}.label`)}
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name='tools'>
              <QuestionnaireTitle>
                {t('components.questionnaire.tools.title')}
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                {t('components.questionnaire.tools.description')}
              </QuestionnaireDescription>
              <QuestionnaireInput
                aria-label={t('components.questionnaire.tools.legend')}
                placeholder={t('components.questionnaire.tools.placeholder')}
              />
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireActions>
              <QuestionnairePrevious>
                {t('reference.previous')}
              </QuestionnairePrevious>
              <QuestionnaireSkip>
                {t('components.questionnaire.skip')}
              </QuestionnaireSkip>
              <QuestionnaireNext>{t('reference.next')}</QuestionnaireNext>
              <QuestionnaireSubmit>
                {t('components.questionnaire.finish')}
              </QuestionnaireSubmit>
            </QuestionnaireActions>
          </Questionnaire>
        )}
      </ExampleSection>

      <ExampleSection
        title={t('components.questionnaire.shortcuts')}
        description={t('components.questionnaire.shortcutsDescription')}
        contentClassName='block space-y-3'
      >
        <Questionnaire
          className='max-w-md'
          defaultItem='source'
          items={SOURCE_ITEMS}
          shortcuts='letters'
          onSubmit={handleSourceSubmit}
        >
          <QuestionnaireItem name='source' required>
            <QuestionnaireTitle>
              {t('components.questionnaire.source.title')}
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              {SOURCE_CHOICES.map((value) => (
                <QuestionnaireChoice key={value} value={value}>
                  {t(`components.questionnaire.source.${value}.label`)}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnaireSubmit>{t('reference.submit')}</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {source ? (
          <p className='text-sm text-muted-foreground'>
            {t('components.questionnaire.sourceSaved', {
              answer: t(`components.questionnaire.source.${source}.label`),
            })}
          </p>
        ) : null}
      </ExampleSection>

      <ExampleSection
        title={t('components.questionnaire.customProgress')}
        description={t('components.questionnaire.customProgressDescription')}
        contentClassName='block'
      >
        <Questionnaire
          className='max-w-md'
          defaultItem='reminders'
          items={PREFERENCE_ITEMS}
          onSubmit={(event) => event.preventDefault()}
        >
          <QuestionnaireProgress
            className='w-full'
            render={(props, state) => (
              <div {...props}>
                <div className='mb-2 flex gap-1.5' aria-hidden='true'>
                  {Array.from({ length: state.total }, (_, index) => (
                    <span
                      key={index}
                      className={
                        index < state.current
                          ? 'h-1.5 flex-1 rounded-full bg-primary'
                          : 'h-1.5 flex-1 rounded-full bg-muted'
                      }
                    />
                  ))}
                </div>
                <span>
                  {t('components.questionnaire.step', {
                    current: state.current,
                    total: state.total,
                  })}
                </span>
              </div>
            )}
          />

          <QuestionnaireItem name='reminders' required>
            <QuestionnaireTitle>
              {t('components.questionnaire.reminders.title')}
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              {REMINDER_CHOICES.map((value) => (
                <QuestionnaireChoice key={value} value={value}>
                  {t(`components.questionnaire.reminders.${value}.label`)}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name='format' required>
            <QuestionnaireTitle>
              {t('components.questionnaire.format.title')}
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              {FORMAT_CHOICES.map((value) => (
                <QuestionnaireChoice key={value} value={value}>
                  {t(`components.questionnaire.format.${value}.label`)}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious>
              {t('reference.previous')}
            </QuestionnairePrevious>
            <QuestionnaireNext>{t('reference.next')}</QuestionnaireNext>
            <QuestionnaireSubmit>{t('reference.save')}</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      </ExampleSection>
    </ExamplePage>
  );
}
