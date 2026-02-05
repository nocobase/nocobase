import { definedTools } from '@nocobase/ai';
import { z } from 'zod';

export default definedTools({
  scope: 'GENERAL',
  execution: 'frontend',
  introduction: {
    title: '{{t("Form filler")}}',
    about: '{{t("Fill the form with the given content")}}',
  },
  definition: {
    name: 'formFiller',
    description: 'Fill the form with the given content',
    schema: z.object({
      form: z.string().describe('The UI Schema ID of the target form to be filled.'),
      data: z
        .object({})
        .catchall(z.any())
        .describe(
          `Structured key-value pairs matching the form's JSON Schema,
       to be assigned to form.values.
       Example: { "username": "alice", "email": "alice@example.com", "age": 30 }`,
        ),
    }),
  },
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have filled the form with the provided data.',
    };
  },
});
