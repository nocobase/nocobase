/**
 * Onboarding survey — a one-question-at-a-time questionnaire with a completion
 * summary, a prose side panel and an FAQ accordion.
 *
 * Skeleton: `PageHeader` → three-column grid. Left, two columns: one `Card`
 * that swaps between the summary `Table` and the `Questionnaire`. Right: an
 * about `Card` in `Typography*` prose and an FAQ `Card` with `Accordion`.
 *
 * Patterns, by the component or block that holds them:
 * - Stepped questionnaire shell with progress and actions: the
 *   `Questionnaire` block, `ITEM_DEFINITIONS`, `activeItem`.
 * - Single and multiple choice: `ChoiceQuestion`.
 * - Rating scale: `RatingQuestion`.
 * - Slider with a live badge: `SliderQuestion`.
 * - Free text: the `QuestionnaireInput` case.
 * - Dispatch on question kind from the data file: the `switch` on
 *   `question.kind`.
 * - Answer summary and reset: `summary`, `startOver`.
 * - Prose block and FAQ: the `Typography*` and `Accordion` cards.
 *
 * Wording is stored as translation keys on the data objects (`titleKey`,
 * `labelKey`) and resolved with `t()`, unlike the other pages, which build
 * keys by template.
 *
 * Demonstration filler to leave behind: the about card and FAQ exist to show
 * Typography and Accordion; `handleSubmit` only flips `completed` and toasts.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckCircle2Icon,
  ClipboardListIcon,
  RotateCcwIcon,
  SparklesIcon,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useMemo, useState } from 'react';

import {
  TypographyH3,
  TypographyList,
  TypographyMuted,
  TypographyP,
} from '@/components/typography';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toaster, toast } from '@/components/ui/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { ExamplePage } from '../../shared';
import {
  RATING_SCALE,
  SURVEY_FAQ,
  SURVEY_QUESTIONS,
  surveyItemDefinitions,
  surveyQuestionIndex,
  type SurveyQuestion,
} from './survey.data';

interface SurveyAnswers {
  readonly role: string | null;
  readonly goals: readonly string[];
  readonly experience: number | null;
  readonly teamSize: number;
  readonly notes: string;
}

const FIRST_QUESTION = SURVEY_QUESTIONS[0]?.name ?? 'role';

const TEAM_SIZE_DEFAULT =
  SURVEY_QUESTIONS.find((question) => question.name === 'teamSize')
    ?.defaultValue ?? 12;

const EMPTY_ANSWERS: SurveyAnswers = {
  role: null,
  goals: [],
  experience: null,
  teamSize: TEAM_SIZE_DEFAULT,
  notes: '',
};

const ITEM_DEFINITIONS = surveyItemDefinitions();

/** The benefits listed beside the questionnaire, as translation keys. */
const BENEFIT_KEYS: readonly string[] = [
  'examples.survey.about.benefitPlan',
  'examples.survey.about.benefitTemplates',
  'examples.survey.about.benefitSession',
];

interface ChoiceQuestionProps {
  readonly question: SurveyQuestion;
  readonly multiple: boolean;
  readonly selected: readonly string[];
  readonly onToggle: (value: string, checked: boolean) => void;
}

function ChoiceQuestion({
  question,
  multiple,
  selected,
  onToggle,
}: ChoiceQuestionProps): ReactElement {
  const { t } = useTranslation();

  return (
    <QuestionnaireItem
      name={question.name}
      required={question.required}
      multiple={multiple}
    >
      <QuestionnaireTitle>{t(question.titleKey)}</QuestionnaireTitle>
      <QuestionnaireDescription>
        {t(question.descriptionKey)}
      </QuestionnaireDescription>
      <QuestionnaireChoices>
        {(question.choices ?? []).map((choice) => (
          <QuestionnaireChoice
            key={choice.value}
            value={choice.value}
            checked={selected.includes(choice.value)}
            onChange={(event) => onToggle(choice.value, event.target.checked)}
          >
            {t(choice.labelKey)}
            {choice.descriptionKey ? (
              <QuestionnaireChoiceDescription>
                {t(choice.descriptionKey)}
              </QuestionnaireChoiceDescription>
            ) : null}
          </QuestionnaireChoice>
        ))}
      </QuestionnaireChoices>
    </QuestionnaireItem>
  );
}

interface RatingQuestionProps {
  readonly question: SurveyQuestion;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
}

function RatingQuestion({
  question,
  value,
  onChange,
}: RatingQuestionProps): ReactElement {
  const { t } = useTranslation();

  return (
    <QuestionnaireItem name={question.name}>
      <QuestionnaireTitle>{t(question.titleKey)}</QuestionnaireTitle>
      <QuestionnaireDescription>
        {t(question.descriptionKey)}
      </QuestionnaireDescription>
      <div className='space-y-2'>
        <ToggleGroup
          variant='outline'
          value={value === null ? [] : [String(value)]}
          onValueChange={(next: string[]) => {
            const picked = next[0];
            onChange(picked ? Number(picked) : null);
          }}
        >
          {RATING_SCALE.map((score) => (
            <ToggleGroupItem
              key={score}
              value={String(score)}
              aria-label={t('examples.survey.ratingLabel', { score })}
              className='w-12 tabular-nums'
            >
              {score}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{question.minLabelKey ? t(question.minLabelKey) : null}</span>
          <span>{question.maxLabelKey ? t(question.maxLabelKey) : null}</span>
        </div>
      </div>
    </QuestionnaireItem>
  );
}

interface SliderQuestionProps {
  readonly question: SurveyQuestion;
  readonly value: number;
  readonly onChange: (value: number) => void;
}

function SliderQuestion({
  question,
  value,
  onChange,
}: SliderQuestionProps): ReactElement {
  const { t } = useTranslation();

  return (
    <QuestionnaireItem name={question.name}>
      <QuestionnaireTitle>{t(question.titleKey)}</QuestionnaireTitle>
      <QuestionnaireDescription>
        {t(question.descriptionKey)}
      </QuestionnaireDescription>
      <div className='space-y-3'>
        <div className='flex items-baseline justify-between'>
          <span className='font-heading text-2xl tabular-nums'>{value}</span>
          <Badge variant='secondary'>
            {t('examples.survey.seatsBadge', { count: value })}
          </Badge>
        </div>
        <Slider
          min={question.min ?? 1}
          max={question.max ?? 100}
          step={question.step ?? 1}
          value={value}
          onValueChange={(next: number | readonly number[]) => {
            onChange(typeof next === 'number' ? next : (next[0] ?? value));
          }}
          aria-label={t(question.titleKey)}
        />
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{question.minLabelKey ? t(question.minLabelKey) : null}</span>
          <span>{question.maxLabelKey ? t(question.maxLabelKey) : null}</span>
        </div>
      </div>
    </QuestionnaireItem>
  );
}

export default function SurveyExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<SurveyAnswers>(EMPTY_ANSWERS);
  const [activeItem, setActiveItem] = useState<string>(FIRST_QUESTION);
  const [completed, setCompleted] = useState(false);

  const current = Math.max(surveyQuestionIndex(activeItem), 0) + 1;

  const summary = useMemo(() => {
    const choiceLabel = (question: SurveyQuestion, value: string): string => {
      const choice = question.choices?.find((entry) => entry.value === value);
      return choice ? t(choice.labelKey) : value;
    };

    return SURVEY_QUESTIONS.map((question) => {
      switch (question.name) {
        case 'role':
          return {
            question,
            answer: answers.role
              ? choiceLabel(question, answers.role)
              : t('reference.none'),
          };
        case 'goals':
          return {
            question,
            answer:
              answers.goals.length > 0
                ? answers.goals
                    .map((value) => choiceLabel(question, value))
                    .join(', ')
                : t('reference.none'),
          };
        case 'experience':
          return {
            question,
            answer:
              answers.experience === null
                ? t('examples.survey.skipped')
                : t('examples.survey.ratingValue', {
                    score: answers.experience,
                  }),
          };
        case 'teamSize':
          return {
            question,
            answer: t('examples.survey.seatsBadge', {
              count: answers.teamSize,
            }),
          };
        default:
          return {
            question,
            answer:
              answers.notes.trim().length > 0
                ? answers.notes.trim()
                : t('examples.survey.skipped'),
          };
      }
    });
  }, [answers, t]);

  const toggleGoal = (value: string, checked: boolean): void => {
    setAnswers((current_) => ({
      ...current_,
      goals: checked
        ? [...current_.goals, value]
        : current_.goals.filter((entry) => entry !== value),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setCompleted(true);
    toast.add({
      type: 'success',
      title: t('examples.survey.submitted'),
      description: t('examples.survey.submittedDescription'),
    });
  };

  const startOver = (): void => {
    setAnswers(EMPTY_ANSWERS);
    setActiveItem(FIRST_QUESTION);
    setCompleted(false);
  };

  const notesQuestion = SURVEY_QUESTIONS.find(
    (question) => question.kind === 'text',
  );

  return (
    <ExamplePage
      title={t('examples.survey.title')}
      description={t('examples.survey.description')}
      actions={
        <Button variant='outline' onClick={startOver}>
          <RotateCcwIcon data-icon='inline-start' />
          {t('examples.survey.startOver')}
        </Button>
      }
    >
      <Toaster />

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <Card className='mx-auto w-full max-w-2xl'>
            {completed ? (
              <>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <CheckCircle2Icon
                      className='size-5 text-primary'
                      aria-hidden='true'
                    />
                    {t('examples.survey.completeTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('examples.survey.completeDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-1/2'>
                          {t('examples.survey.summaryQuestion')}
                        </TableHead>
                        <TableHead>
                          {t('examples.survey.summaryAnswer')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.map((row) => (
                        <TableRow key={row.question.name}>
                          <TableCell className='align-top text-muted-foreground'>
                            {t(row.question.titleKey)}
                          </TableCell>
                          <TableCell className='font-medium text-pretty'>
                            {row.answer}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className='justify-end'>
                  <Button variant='outline' onClick={startOver}>
                    <RotateCcwIcon data-icon='inline-start' />
                    {t('examples.survey.startOver')}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{t('examples.survey.formTitle')}</CardTitle>
                  <CardDescription>
                    {t('examples.survey.formDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Questionnaire
                    items={ITEM_DEFINITIONS}
                    item={activeItem}
                    onItemChange={setActiveItem}
                    shortcuts='letters'
                    onSubmit={handleSubmit}
                  >
                    <QuestionnaireProgress>
                      {t('examples.survey.progress', {
                        current,
                        total: SURVEY_QUESTIONS.length,
                      })}
                    </QuestionnaireProgress>

                    {SURVEY_QUESTIONS.map((question) => {
                      if (question.kind === 'single') {
                        return (
                          <ChoiceQuestion
                            key={question.name}
                            question={question}
                            multiple={false}
                            selected={answers.role ? [answers.role] : []}
                            onToggle={(value, checked) =>
                              setAnswers((state) => ({
                                ...state,
                                role: checked ? value : null,
                              }))
                            }
                          />
                        );
                      }
                      if (question.kind === 'multiple') {
                        return (
                          <ChoiceQuestion
                            key={question.name}
                            question={question}
                            multiple
                            selected={answers.goals}
                            onToggle={toggleGoal}
                          />
                        );
                      }
                      if (question.kind === 'rating') {
                        return (
                          <RatingQuestion
                            key={question.name}
                            question={question}
                            value={answers.experience}
                            onChange={(value) =>
                              setAnswers((state) => ({
                                ...state,
                                experience: value,
                              }))
                            }
                          />
                        );
                      }
                      if (question.kind === 'slider') {
                        return (
                          <SliderQuestion
                            key={question.name}
                            question={question}
                            value={answers.teamSize}
                            onChange={(value) =>
                              setAnswers((state) => ({
                                ...state,
                                teamSize: value,
                              }))
                            }
                          />
                        );
                      }
                      return null;
                    })}

                    {notesQuestion ? (
                      <QuestionnaireItem name={notesQuestion.name}>
                        <QuestionnaireTitle>
                          {t(notesQuestion.titleKey)}
                        </QuestionnaireTitle>
                        <QuestionnaireDescription>
                          {t(notesQuestion.descriptionKey)}
                        </QuestionnaireDescription>
                        <QuestionnaireInput
                          value={answers.notes}
                          onChange={(event) =>
                            setAnswers((state) => ({
                              ...state,
                              notes: event.target.value,
                            }))
                          }
                          placeholder={
                            notesQuestion.placeholderKey
                              ? t(notesQuestion.placeholderKey)
                              : undefined
                          }
                        />
                      </QuestionnaireItem>
                    ) : null}

                    <QuestionnaireActions>
                      <QuestionnairePrevious>
                        {t('reference.previous')}
                      </QuestionnairePrevious>
                      <QuestionnaireSkip>
                        {t('examples.survey.skip')}
                      </QuestionnaireSkip>
                      <QuestionnaireNext>
                        {t('reference.next')}
                      </QuestionnaireNext>
                      <QuestionnaireSubmit>
                        {t('reference.submit')}
                      </QuestionnaireSubmit>
                    </QuestionnaireActions>
                  </Questionnaire>
                </CardContent>
              </>
            )}
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ClipboardListIcon className='size-4' aria-hidden='true' />
                {t('examples.survey.about.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <TypographyH3 className='text-base'>
                {t('examples.survey.about.heading')}
              </TypographyH3>
              <TypographyP className='text-sm'>
                {t('examples.survey.about.body')}
              </TypographyP>
              <TypographyList className='text-sm'>
                {BENEFIT_KEYS.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </TypographyList>
              <TypographyMuted>
                {t('examples.survey.about.footnote')}
              </TypographyMuted>
            </CardContent>
            <CardFooter>
              <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <SparklesIcon className='size-3.5' aria-hidden='true' />
                {t('examples.survey.about.hint')}
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('examples.survey.faq.title')}</CardTitle>
              <CardDescription>
                {t('examples.survey.faq.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion defaultValue={[SURVEY_FAQ[0]?.id ?? '']}>
                {SURVEY_FAQ.map((entry) => (
                  <AccordionItem key={entry.id} value={entry.id}>
                    <AccordionTrigger>{t(entry.questionKey)}</AccordionTrigger>
                    <AccordionContent>{t(entry.answerKey)}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </ExamplePage>
  );
}
