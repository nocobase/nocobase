/**
 * Mock data for the Survey example. Nothing here reaches a server.
 *
 * Every user-visible string is a translation key the page resolves, so the
 * questionnaire reads in the interface language rather than in English only.
 */

export type SurveyQuestionKind =
  'single' | 'multiple' | 'rating' | 'slider' | 'text';

export interface SurveyChoice {
  readonly value: string;
  readonly labelKey: string;
  readonly descriptionKey?: string;
}

export interface SurveyQuestion {
  readonly name: string;
  readonly kind: SurveyQuestionKind;
  readonly titleKey: string;
  readonly descriptionKey: string;
  /** Required questions block the Next button until they are answered. */
  readonly required: boolean;
  readonly choices?: readonly SurveyChoice[];
  readonly placeholderKey?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly defaultValue?: number;
  readonly minLabelKey?: string;
  readonly maxLabelKey?: string;
}

export interface SurveyFaqEntry {
  readonly id: string;
  readonly questionKey: string;
  readonly answerKey: string;
}

/** The shape `Questionnaire` expects for its `items` collection. */
export interface SurveyItemDefinition {
  readonly name: string;
  readonly required: boolean;
  readonly choices?: readonly { readonly value: string }[];
}

/** Values the familiarity question offers, low to high. */
export const RATING_SCALE: readonly number[] = [1, 2, 3, 4, 5];

export const SURVEY_QUESTIONS: readonly SurveyQuestion[] = [
  {
    name: 'role',
    kind: 'single',
    titleKey: 'examples.survey.questions.role.title',
    descriptionKey: 'examples.survey.questions.role.description',
    required: true,
    choices: [
      {
        value: 'operations',
        labelKey: 'examples.survey.questions.role.operations',
        descriptionKey: 'examples.survey.questions.role.operationsHint',
      },
      {
        value: 'finance',
        labelKey: 'examples.survey.questions.role.finance',
        descriptionKey: 'examples.survey.questions.role.financeHint',
      },
      {
        value: 'engineering',
        labelKey: 'examples.survey.questions.role.engineering',
        descriptionKey: 'examples.survey.questions.role.engineeringHint',
      },
      {
        value: 'founder',
        labelKey: 'examples.survey.questions.role.founder',
        descriptionKey: 'examples.survey.questions.role.founderHint',
      },
    ],
  },
  {
    name: 'goals',
    kind: 'multiple',
    titleKey: 'examples.survey.questions.goals.title',
    descriptionKey: 'examples.survey.questions.goals.description',
    required: true,
    choices: [
      { value: 'orders', labelKey: 'examples.survey.questions.goals.orders' },
      {
        value: 'inventory',
        labelKey: 'examples.survey.questions.goals.inventory',
      },
      {
        value: 'reporting',
        labelKey: 'examples.survey.questions.goals.reporting',
      },
      {
        value: 'automation',
        labelKey: 'examples.survey.questions.goals.automation',
      },
      { value: 'portal', labelKey: 'examples.survey.questions.goals.portal' },
    ],
  },
  {
    name: 'experience',
    kind: 'rating',
    titleKey: 'examples.survey.questions.experience.title',
    descriptionKey: 'examples.survey.questions.experience.description',
    required: false,
    minLabelKey: 'examples.survey.questions.experience.low',
    maxLabelKey: 'examples.survey.questions.experience.high',
  },
  {
    name: 'teamSize',
    kind: 'slider',
    titleKey: 'examples.survey.questions.teamSize.title',
    descriptionKey: 'examples.survey.questions.teamSize.description',
    required: false,
    min: 1,
    max: 200,
    step: 1,
    defaultValue: 12,
    minLabelKey: 'examples.survey.questions.teamSize.low',
    maxLabelKey: 'examples.survey.questions.teamSize.high',
  },
  {
    name: 'notes',
    kind: 'text',
    titleKey: 'examples.survey.questions.notes.title',
    descriptionKey: 'examples.survey.questions.notes.description',
    required: false,
    placeholderKey: 'examples.survey.questions.notes.placeholder',
  },
];

export const SURVEY_FAQ: readonly SurveyFaqEntry[] = [
  {
    id: 'time',
    questionKey: 'examples.survey.faq.timeQuestion',
    answerKey: 'examples.survey.faq.timeAnswer',
  },
  {
    id: 'privacy',
    questionKey: 'examples.survey.faq.privacyQuestion',
    answerKey: 'examples.survey.faq.privacyAnswer',
  },
  {
    id: 'change',
    questionKey: 'examples.survey.faq.changeQuestion',
    answerKey: 'examples.survey.faq.changeAnswer',
  },
  {
    id: 'skip',
    questionKey: 'examples.survey.faq.skipQuestion',
    answerKey: 'examples.survey.faq.skipAnswer',
  },
];

/**
 * The collection `Questionnaire` validates against: it pairs every rendered
 * item with its declared choices so progress and keyboard shortcuts line up.
 */
export function surveyItemDefinitions(): readonly SurveyItemDefinition[] {
  return SURVEY_QUESTIONS.map((question) =>
    question.choices
      ? {
          name: question.name,
          required: question.required,
          choices: question.choices.map((choice) => ({ value: choice.value })),
        }
      : { name: question.name, required: question.required },
  );
}

export function surveyQuestionIndex(name: string): number {
  return SURVEY_QUESTIONS.findIndex((question) => question.name === name);
}
