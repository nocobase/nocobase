import { z } from 'zod';
import {
  FOUNDATION_API_CONDITIONS,
  type FoundationApiEvidence,
} from '../shared/foundation.js';

/** The API and source-free build artifact carry the same bounded, symbolic evidence. */
export const ApiEvidenceSchema: z.ZodType<FoundationApiEvidence> = z
  .object({
    method: z.string(),
    path: z.string(),
    providers: z.array(z.string()),
    conditions: z
      .array(
        z
          .object({
            kind: z.enum(FOUNDATION_API_CONDITIONS),
            source: z.enum([
              '@nocobase/db#databaseManagerToken',
              '@nocobase/app-plugin-authentication#authenticationToken.required',
              'hono/body-limit#bodyLimit',
              '@nocobase/app-server/router#apiValidator',
            ]),
          })
          .strict(),
      )
      .max(4),
  })
  .strict();
