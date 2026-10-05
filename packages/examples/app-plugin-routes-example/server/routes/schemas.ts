import { z } from 'zod';

// Each exported schema is annotated with the value it produces, which isolated declarations require of an export.

/** What `GET /api/routesExample` answers. */
export interface RoutesExampleGreeting {
  readonly scope: 'api';
  readonly plugin: string;
  readonly message: string;
}
export const RoutesExampleGreeting: z.ZodType<RoutesExampleGreeting> = z
  .object({
    scope: z
      .literal('api')
      .meta({ description: 'The Route scope that answered.' }),
    plugin: z
      .string()
      .meta({ description: 'The package that contributed the Route.' }),
    message: z.string(),
  })
  .meta({ ref: 'RoutesExampleGreeting' });
