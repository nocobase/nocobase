import type { AIEmployeeClient } from '../../ai-employee-client.js';
import type { LLMService } from '../../llm-service-service.js';

/** What the routed model editor would lose, reported so the page can hold browser back and forward. */
export interface ModelEditorLeaveState {
  readonly dirty: boolean;
  readonly pending: boolean;
}

export interface LLMServicesContext {
  readonly ai: AIEmployeeClient;
  readonly services: readonly LLMService[];
  readonly loading: boolean;
  readonly loadError: string | undefined;
  readonly onSaved: (service: LLMService) => void;
  readonly reportLeaveState: (state: ModelEditorLeaveState) => void;
}
