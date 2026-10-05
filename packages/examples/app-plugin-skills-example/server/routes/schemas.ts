import { z } from 'zod';

import type { AppNoticeData } from '../tokens.js';

// Each exported schema is annotated with the value it produces, which isolated declarations require of an export.

/** What `GET /api/skillsExample/notice` answers. */
export const AppNotice: z.ZodType<AppNoticeData> = z
  .object({
    title: z.string(),
    description: z.string(),
    tone: z
      .enum(['info', 'success', 'warning'])
      .meta({ description: 'How the `AppNotice` component styles it.' }),
  })
  .meta({ ref: 'SkillsExampleNotice' });
