/**
 * The fields a page may edit on each kind of record, in the state that
 * allows it. The server keeps only these, and the pages send only these, so
 * an edit never writes back a whole record it read.
 */

export const INCOMING_FIELDS: readonly string[] = [
  'title',
  'code',
  'sender',
  'senderRef',
  'summary',
  'officeOpinion',
  'attachments',
  'distributionType',
  'officeHeadId',
  'officeLeaderId',
  'ccManagement',
];

export const EXTRACTION_FIELDS: readonly string[] = [
  'category',
  'complexity',
  'agreedDeliveryAt',
  'sourceSystem',
  'needsDownload',
  'feedbackNote',
  'feedbackFiles',
  'reviewerId',
  'managerId',
  'confirmerId',
];

export type TaskKind = 'clerk' | 'team' | 'executor';

export const TASK_FIELDS: Readonly<Record<TaskKind, readonly string[]>> = {
  clerk: [
    'opinion',
    'redHeadFeedback',
    'outgoingRef',
    'attachments',
    'feedback',
  ],
  team: ['opinion', 'redHeadFeedback', 'attachments', 'feedback'],
  executor: ['redHeadFeedback', 'attachments', 'feedback'],
};

/** `values` with only `fields`, as an edit sends them. */
export function pickEditable(
  values: Readonly<Record<string, unknown>>,
  fields: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((field) => field in values)
      .map((field) => [field, values[field]]),
  );
}
