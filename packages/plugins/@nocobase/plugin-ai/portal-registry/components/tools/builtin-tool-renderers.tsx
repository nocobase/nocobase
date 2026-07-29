import type { AIToolRendererMap } from "./tool-renderer-provider";
import { BusinessReportRenderer } from "./business-report-renderer";
import { ChartRenderer } from "./chart-renderer";
import { SubAgentRenderer } from "./sub-agent-renderer";
import { SuggestionsRenderer } from "./suggestions-renderer";
import { WorkflowRenderer } from "./workflow-renderer";

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
  "dispatch-sub-agent-task": {
    component: SubAgentRenderer,
    standalone: true,
  },
  aiEmployeeWorkflowTaskOutput: {
    component: WorkflowRenderer,
    handlesApproval: true,
    standalone: true,
  },
};
