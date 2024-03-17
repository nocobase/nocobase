import { useFlowContext } from '../FlowContext';

export function useWorkflowExecuted() {
  const { workflow } = useFlowContext();
  return Boolean(workflow?.allExecuted);
}
