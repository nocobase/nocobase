/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
// @ts-ignore
import pkg from '../../../package.json';

export const ArgSchema = z.object({
  datasource: z.string().describe(`{{t("ai.tools.dataQuery.args.datasource", { ns: "${pkg.name}" })}}`),
  collectionName: z.string().describe(`{{t("ai.tools.dataQuery.args.collectionName", { ns: "${pkg.name}" })}}`),
  fields: z.array(z.string()).describe(`{{t("ai.tools.dataQuery.args.fields", { ns: "${pkg.name}" })}}`),
  appends: z.array(z.string()).describe(`{{t("ai.tools.dataQuery.args.appends", { ns: "${pkg.name}" })}}`),
  filter: z.object({}).catchall(z.any()).describe(`# Parameters definition
\`\`\`
export type QueryCondition = {
  [field: string]: {
    [operator: string]: any;
  };
};


export type QueryObject =
  | {
      [logic: string]: (QueryCondition | QueryObject)[];
    }
  | QueryCondition
\`\`\`

Field names are collection field names.
Operator names are query operators such as \`$eq\`, \`$in\`, or \`$dateOn\`.
Logical keys in \`QueryObject\` should be \`$and\` or \`$or\`.

\`\`\`
const example1: QueryCondition = {
  age: { $gt: 18 },
  name: { $like: '%John%' },
};

const example2: QueryCondition = {
  status: { $in: ['active', 'pending'] },
};
\`\`\`

\`\`\`
const example1: QueryObject = {
  $and: [
    { age: { $gt: 18 } },
    { status: { $eq: 'active' } }
  ]
};

const example2: QueryObject = {
  $or: [
    { name: { $like: '%John%' } },
    {
      $and: [
        { age: { $gte: 30 } },
        { status: { $eq: 'pending' } }
      ]
    }
  ]
};

const example3: QueryObject = { age: { $lt: 50 } };
\`\`\`

Supported scalar operators include:
\`$eq\`, \`$ne\`, \`$gt\`, \`$gte\`, \`$lt\`, \`$lte\`, \`$like\`, \`$notLike\`, \`$includes\`, \`$notIncludes\`, \`$in\`, \`$notIn\`, \`$dateOn\`, \`$dateNotOn\`, \`$dateBefore\`, \`$dateAfter\`, \`$dateNotBefore\`, \`$dateNotAfter\`, \`$dateBetween\`, \`$empty\`, \`$notEmpty\`

Frontend date filter contract:
- Always follow the same frontend-compatible date filter contract used by NocoBase filters.
- \`filter\` itself must be a structured object. Do not pass a JSON-encoded string such as \`"{\\"createdAt\\":{\\"$dateOn\\":\\"2025-11\\"}}"\`.
- For calendar-style date filtering, supported operators are exactly:
  - \`$dateOn\`
  - \`$dateNotOn\`
  - \`$dateBefore\`
  - \`$dateAfter\`
  - \`$dateNotBefore\`
  - \`$dateNotAfter\`
  - \`$dateBetween\`
  - \`$empty\`
  - \`$notEmpty\`
- Do not generate \`$gte\`, \`$gt\`, \`$lte\`, \`$lt\`, or custom operator names for calendar date ranges.
- Allowed values:
  - for \`$dateOn\`, \`$dateNotOn\`, \`$dateBefore\`, \`$dateAfter\`, \`$dateNotBefore\`, \`$dateNotAfter\`: \`YYYY-MM-DD\`, \`YYYY-MM\`, \`YYYY\`, a relative period object, or an exact datetime string only when the user explicitly wants timestamp comparison
  - for \`$dateBetween\`: \`["YYYY-MM-DD", "YYYY-MM-DD"]\` or a relative period object
  - for \`$empty\` and \`$notEmpty\`: no value
- Relative period object \`type\` values are exactly:
  - \`today\`
  - \`yesterday\`
  - \`tomorrow\`
  - \`thisWeek\`
  - \`lastWeek\`
  - \`nextWeek\`
  - \`thisMonth\`
  - \`lastMonth\`
  - \`nextMonth\`
  - \`thisQuarter\`
  - \`lastQuarter\`
  - \`nextQuarter\`
  - \`thisYear\`
  - \`lastYear\`
  - \`nextYear\`
  - \`past\`
  - \`next\`
- If \`type\` is \`past\` or \`next\`, also provide:
  - \`number\`: positive integer
  - \`unit\`: one of \`day\`, \`week\`, \`month\`, \`quarter\`, \`year\`
- Prefer frontend-style calendar filters such as:
  - \`{ createdAt: { $dateOn: "2026-04" } }\`
  - \`{ createdAt: { $dateOn: { type: "thisMonth" } } }\`
  - \`{ createdAt: { $dateBetween: ["2026-04-01", "2026-04-30"] } }\`
- Do not expand calendar queries into UTC month-start or day-start boundary expressions.
- If the user explicitly asks for exact timestamp comparison instead of a calendar period:
  - timezone-aware datetime fields: use ISO 8601 strings such as \`2026-04-10T12:00:00.000Z\`
  - \`datetimeNoTz\` fields: use local datetime strings such as \`2026-04-10 12:00:00\`
  - \`dateOnly\` fields: use date-only strings without time components
`),
  sort: z.array(z.string()).describe(`{{t("ai.tools.dataQuery.args.sort", { ns: "${pkg.name}" })}}`),
  offset: z.number().optional().describe(`{{t("ai.tools.dataQuery.args.offset", { ns: "${pkg.name}" })}}`),
  limit: z.number().optional().describe(`{{t("ai.tools.dataQuery.args.limit", { ns: "${pkg.name}" })}}`),
});

export type ArgType = z.infer<typeof ArgSchema>;
