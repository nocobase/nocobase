import type { AIToolRendererMap } from './tool-renderer-context.js';
import { BusinessReportRenderer } from './business-report-renderer.js';
import { ChartRenderer } from './chart-renderer.js';
import { SubAgentRenderer } from './sub-agent-renderer.js';
import { SuggestionsRenderer } from './suggestions-renderer.js';
import { WorkflowRenderer } from './workflow-renderer.js';

export const builtInToolRenderers: AIToolRendererMap = {
  suggestions: {
    component: SuggestionsRenderer,
    handlesApproval: true,
    standalone: true,
  },
  businessReportGenerator: {
    component: BusinessReportRenderer,
    standalone: true,
  },
  chartGenerator: {
    component: ChartRenderer,
    standalone: true,
  },
  'dispatch-sub-agent-task': {
    component: SubAgentRenderer,
    standalone: true,
  },
  aiEmployeeWorkflowTaskOutput: {
    component: WorkflowRenderer,
    handlesApproval: true,
    standalone: true,
  },
};
