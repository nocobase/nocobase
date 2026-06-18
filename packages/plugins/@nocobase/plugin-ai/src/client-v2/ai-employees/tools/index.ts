/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ToolsOptions, ToolsRegistration } from '@nocobase/client-v2';
import { formFillerTool } from '../form-filler/tools';
import {
  getCodeSnippetTool,
  getContextApisTool,
  getContextEnvsTool,
  getContextVarsTool,
  lintAndTestJSTool,
  listCodeSnippetTool,
  patchJSCodeTool,
  readJSCodeTool,
  writeJSCodeTool,
} from './ai-coding';
import { vizRunQueryTool, vizSwitchModesTool } from './data-visualization';
import { BusinessReportCard } from './BusinessReportCard';
import { BusinessReportModal, BusinessReportModalFooter } from './BusinessReportModal';
import { ChartGeneratorCard } from './ChartGeneratorCard';
import { CodeToolCard } from './CodeToolCard';
import { DataModelingCard } from './DataModelingCard';
import { DataModelingModal, useDataModelingOnOk } from './DataModelingModal';
import { SubAgentDispatchCard } from './SubAgentDispatchCard';
import { SuggestionsOptionsCard } from './SuggestionsOptionsCard';
import { WorkflowTaskOutputCard } from './WorkflowTaskOutputCard';

export { ChartGeneratorCard } from './ChartGeneratorCard';
export { SubAgentDispatchCard } from './SubAgentDispatchCard';
export { SuggestionsOptionsCard } from './SuggestionsOptionsCard';
export { BusinessReportCard } from './BusinessReportCard';
export { BusinessReportModal, BusinessReportModalFooter } from './BusinessReportModal';
export { CodeToolCard } from './CodeToolCard';
export { DataModelingCard } from './DataModelingCard';
export { DataModelingModal, useDataModelingOnOk } from './DataModelingModal';
export { WorkflowTaskOutputCard } from './WorkflowTaskOutputCard';

export const chartGeneratorTool: [string, ToolsOptions] = [
  'chartGenerator',
  {
    ui: {
      card: ChartGeneratorCard,
    },
  },
];

export const businessReportGeneratorTool: [string, ToolsOptions] = [
  'businessReportGenerator',
  {
    ui: {
      card: BusinessReportCard,
      modal: {
        title: 'Business analysis report',
        hideOkButton: true,
        props: {
          width: '92%',
          styles: {
            body: {
              height: 'calc(100vh - 240px)',
              maxHeight: 'calc(100vh - 240px)',
              overflow: 'hidden',
            },
          },
        },
        footer: BusinessReportModalFooter,
        Component: BusinessReportModal,
      },
    },
  },
];

export const suggestionsTool: [string, ToolsOptions] = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];

export const dispatchSubAgentTaskTool: [string, ToolsOptions] = [
  'dispatch-sub-agent-task',
  {
    ui: {
      card: SubAgentDispatchCard,
    },
  },
];

export const defineCollectionsTool: [string, ToolsOptions] = [
  'defineCollections',
  {
    ui: {
      card: DataModelingCard,
      modal: {
        title: 'Data modeling',
        okText: 'Submit',
        props: {
          width: '90%',
        },
        useOnOk: useDataModelingOnOk,
        Component: DataModelingModal,
      },
    },
  },
];

export const aiEmployeeWorkflowTaskOutputTool: [string, ToolsOptions] = [
  'aiEmployeeWorkflowTaskOutput',
  {
    ui: {
      card: WorkflowTaskOutputCard,
    },
  },
];

writeJSCodeTool[1].ui = {
  ...writeJSCodeTool[1].ui,
  card: CodeToolCard,
};

patchJSCodeTool[1].ui = {
  ...patchJSCodeTool[1].ui,
  card: CodeToolCard,
};

export const pluginAIClientV2BuiltinTools: Array<[string, ToolsOptions]> = [
  vizSwitchModesTool,
  vizRunQueryTool,
  defineCollectionsTool,
  formFillerTool,
  chartGeneratorTool,
  businessReportGeneratorTool,
  listCodeSnippetTool,
  getCodeSnippetTool,
  suggestionsTool,
  dispatchSubAgentTaskTool,
  aiEmployeeWorkflowTaskOutputTool,
  getContextApisTool,
  getContextEnvsTool,
  getContextVarsTool,
  readJSCodeTool,
  writeJSCodeTool,
  patchJSCodeTool,
  lintAndTestJSTool,
];

export const pluginAIClientV2BuiltinToolNames = pluginAIClientV2BuiltinTools.map(([name]) => name);

export function registerPluginAIClientV2BuiltinTools(toolsManager: ToolsRegistration) {
  pluginAIClientV2BuiltinTools.forEach((tool) => {
    toolsManager.registerTools(...tool);
  });
}
