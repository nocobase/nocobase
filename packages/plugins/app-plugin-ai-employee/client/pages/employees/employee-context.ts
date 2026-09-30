import { useOutletContext } from 'react-router';
import type {
  AIEmployeeEditableValues,
  AIEmployeeRecord,
  AIMetadataItem,
  EnabledModelOption,
  KnowledgeBaseOption,
} from '../../ai-employee-service.js';

export interface EmployeeEditorContextValue {
  selected: AIEmployeeRecord;
  draft: AIEmployeeEditableValues;
  saving: boolean;
  customRoleMode: boolean | undefined;
  setCustomRoleMode: (value: boolean) => void;
  patchDraft: (patch: Partial<AIEmployeeEditableValues>) => void;
  models: EnabledModelOption[];
  knowledgeBases: KnowledgeBaseOption[];
  skills: AIMetadataItem[];
  skillsLoading: boolean;
  skillsError: boolean;
  retrySkills: () => void;
  tools: AIMetadataItem[];
  toolsLoading: boolean;
  toolsError: boolean;
  retryTools: () => void;
  updateSkillNames: (update: (names: string[]) => string[]) => void;
  toolEditsDisabled: boolean;
  updateToolNames: (name: string, checked: boolean) => void;
  updateToolPermission: (name: string, autoCall: boolean) => void;
}

export function useEmployeeEditor(): EmployeeEditorContextValue {
  return useOutletContext<EmployeeEditorContextValue>();
}
