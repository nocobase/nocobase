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
import pkg from '../../../../package.json';

export const ArgSchema = z.object({
  datasource: z.string().describe(`{{t("ai.tools.dataQuery.args.datasource", { ns: "${pkg.name}" })}}`),
  collectionName: z.string().describe(`{{t("ai.tools.dataQuery.args.collectionName", { ns: "${pkg.name}" })}}`),
  fields: z.array(z.string()).describe(`{{t("ai.tools.dataQuery.args.fields", { ns: "${pkg.name}" })}}`),
  appends: z.array(z.string()).describe(`{{t("ai.tools.dataQuery.args.appends", { ns: "${pkg.name}" })}}`),
  filter: z.object({}).catchall(z.any()).describe(`# Parameters definition
\`\`\`
export type QueryCondition = {
  [field: string]: { // \`field\` key is Field name
    [operator: string]: any; // \`operator\` key is Query condition operator.
  };
};


export type QueryObject =
  | {
      [logic: string]: (QueryCondition | QueryObject)[]; // \`logic\` key is the relationship between query conditions, should be one of '$and', '$or', the value is recursion object array, item in array can be QueryCondition or QueryObject
    }
  | QueryCondition // QueryCondition definition above;
\`\`\`


// QueryCondition examples

\`\`\`
const example1: QueryCondition = {
  age: { $gt: 18 },          // age great than 18
  name: { $like: '%John%' }, // name include John
};

const example2: QueryCondition = {
  status: { $in: ['active', 'pending'] }, // status is active or pending
};
\`\`\`

// QueryObject example
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
`),
  sort: z.array(z.string()).describe(`{{t("ai.tools.dataQuery.args.sort", { ns: "${pkg.name}" })}}`),
  offset: z.number().optional().describe(`{{t("ai.tools.dataQuery.args.offset", { ns: "${pkg.name}" })}}`),
  limit: z.number().optional().describe(`{{t("ai.tools.dataQuery.args.limit", { ns: "${pkg.name}" })}}`),
});

export type ArgType = z.infer<typeof ArgSchema>;
