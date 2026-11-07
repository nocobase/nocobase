import { z } from 'zod';

const text = z.string().trim().max(160);
const date = z.union([z.literal(''), z.iso.date()]);
export const OnboardingState = z.enum(['draft', 'submitted']);
export const OnboardingDocument = z.strictObject({
  id: z.string().uuid().optional(),
  kind: z.enum(['identity', 'workPermit', 'serviceAgreement']),
  title: text,
  referenceNo: text,
});
export const OnboardingInput = z.strictObject({
  fullName: text,
  workEmail: z.union([z.literal(''), z.email().max(160).toLowerCase()]),
  nationality: z.union([z.literal(''), z.string().regex(/^[A-Z]{2}$/)]),
  departmentId: z.string().uuid().nullable(),
  jobTitle: text,
  employmentType: z.enum(['fullTime', 'contractor']).nullable(),
  startDate: date,
  probationMonths: z.number().int().min(1).max(12).nullable(),
  contractEndDate: date,
  documents: z.array(OnboardingDocument).max(20),
});
export type OnboardingInput = z.infer<typeof OnboardingInput>;
export const OnboardingUpdate = OnboardingInput.extend({
  version: z.number().int().nonnegative(),
});
export const OnboardingSubmit = OnboardingInput.superRefine((value, ctx) => {
  const required = (field: string) =>
    ctx.addIssue({
      code: 'custom',
      path: [field],
      message: 'This field is required.',
    });
  for (const field of [
    'fullName',
    'workEmail',
    'nationality',
    'departmentId',
    'jobTitle',
    'employmentType',
    'startDate',
  ] as const)
    if (!value[field]) required(field);
  if (value.employmentType === 'fullTime' && value.probationMonths === null)
    required('probationMonths');
  if (value.employmentType === 'contractor') {
    if (!value.contractEndDate) required('contractEndDate');
    else if (value.startDate && value.contractEndDate <= value.startDate)
      ctx.addIssue({
        code: 'custom',
        path: ['contractEndDate'],
        message: 'The contract must end after the start date.',
      });
  }
  const kinds = [
    'identity',
    ...(value.nationality && value.nationality !== 'CN' ? ['workPermit'] : []),
    ...(value.employmentType === 'contractor' ? ['serviceAgreement'] : []),
  ];
  for (const kind of kinds)
    if (
      !value.documents.some((d) => d.kind === kind && d.title && d.referenceNo)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['documents'],
        message: `A complete ${kind} document is required.`,
      });
  for (const [index, doc] of value.documents.entries())
    for (const field of ['title', 'referenceNo'] as const)
      if (!doc[field])
        ctx.addIssue({
          code: 'custom',
          path: ['documents', index, field],
          message: 'This field is required.',
        });
});
const steps = [
  ['fullName', 'workEmail', 'nationality'],
  [
    'departmentId',
    'jobTitle',
    'employmentType',
    'startDate',
    'probationMonths',
    'contractEndDate',
  ],
  ['documents'],
];
export function onboardingIssues(input: OnboardingInput, step: number) {
  const result = OnboardingSubmit.safeParse(input);
  return result.success
    ? []
    : result.error.issues.filter((issue) =>
        steps[step]?.includes(String(issue.path[0])),
      );
}
export function onboardingResumeStep(input: OnboardingInput): number {
  const step = steps.findIndex(
    (_, index) => onboardingIssues(input, index).length > 0,
  );
  return step === -1 ? 3 : step;
}
export const emptyOnboarding: OnboardingInput = {
  fullName: '',
  workEmail: '',
  nationality: '',
  departmentId: null,
  jobTitle: '',
  employmentType: null,
  startDate: '',
  probationMonths: null,
  contractEndDate: '',
  documents: [],
};
export const OnboardingRecord = OnboardingInput.omit({
  documents: true,
}).extend({
  id: z.string(),
  coordinatorId: z.string(),
  status: OnboardingState,
  lifecycleVersion: z.number(),
  employeeId: z.string().nullable(),
  createdAt: z.string(),
});
export const OnboardingDetail = z.object({
  record: OnboardingRecord,
  departmentName: z.string().nullable(),
  documents: z.array(OnboardingDocument.extend({ id: z.string() })),
  employee: z
    .object({
      id: z.string(),
      caseId: z.string(),
      fullName: z.string(),
      workEmail: z.string(),
      departmentId: z.string(),
      jobTitle: z.string(),
      startDate: z.string(),
    })
    .nullable(),
  actions: z.object({ edit: z.boolean(), submit: z.boolean() }),
  history: z.array(
    z.object({
      id: z.string(),
      transition: z.string(),
      from: z.string().nullable(),
      to: z.string(),
      actorId: z.string(),
      at: z.string(),
    }),
  ),
});
export type OnboardingDetail = z.infer<typeof OnboardingDetail>;
export const ONBOARDING_ACCESS = {
  type: 'settings',
  id: 'onboarding',
} as const;
export interface OnboardingActor {
  id: string;
  coordinate: boolean;
  view: boolean;
}
