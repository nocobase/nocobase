import { definedTools } from '@nocobase/ai';
import { z } from 'zod';

export default definedTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("Chart generator")}}',
    about: '{{t("Generates ECharts options (JSON) based on user input or data context.")}}',
  },
  definition: {
    name: 'chartGenerator',
    description: 'Generates ECharts options (JSON) based on user input or data context.',
    schema: z.object({
      options: z
        .object({})
        .catchall(z.any())
        .describe(
          `Valid ECharts options object.
        Example: {
          "title": { "text": "Sales Trend" },
          "tooltip": {},
          "xAxis": { "type": "category", "data": ["Jan", "Feb", "Mar"] },
          "yAxis": { "type": "value" },
          "series": [{ "type": "line", "data": [120, 200, 150] }]
        }`,
        ),
    }),
  },
  invoke: async () => {
    return {
      status: 'success',
      content: 'Ok',
    };
  },
});
