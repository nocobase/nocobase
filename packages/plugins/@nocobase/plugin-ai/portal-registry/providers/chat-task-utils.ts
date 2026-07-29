import { getAIWorkContextRequiredTools, mergeAIRequiredTools } from "./page-context";
import type {
  AIChatTaskRuntime,
  AIEmployee,
  AIEmployeeTask,
  AIEmployeeTasks,
  AIEmployeeTaskTrigger,
  AIModel,
  AIWorkContextItem,
} from "./types";

const EMPTY_TASKS: AIEmployeeTask[] = [];

export type AIChatTaskSet = {
  employeeUsername: string;
  tasks: AIEmployeeTask[];
  context?: AIWorkContextItem[];
};

export function getConfiguredAIChatTaskSet({
  employeeUsername,
  defaultEmployeeUsername,
  defaultTasks,
  employeeTasks,
  inheritedContext,
}: {
  employeeUsername: string;
  defaultEmployeeUsername: string;
  defaultTasks: AIEmployeeTask[];
  employeeTasks: AIEmployeeTasks;
  inheritedContext: AIWorkContextItem[];
}): AIChatTaskSet | undefined {
  const tasks =
    employeeTasks[employeeUsername] ??
    (employeeUsername === defaultEmployeeUsername
      ? defaultTasks
      : EMPTY_TASKS);
  return tasks.length
    ? { employeeUsername, tasks, context: inheritedContext }
    : undefined;
}

export function findTriggeredAIEmployee(
  employees: AIEmployee[],
  requested: AIEmployeeTaskTrigger["aiEmployee"]
) {
  return typeof requested === "string"
    ? employees.find((item) => item.username === requested)
    : employees.find((item) => item.username === requested.username) ??
        requested;
}

export function getTriggeredAIEmployeeTask(options: AIEmployeeTaskTrigger) {
  return (
    options.task ??
    (options.tasks?.length === 1 && options.auto !== false
      ? options.tasks[0]
      : undefined)
  );
}

export function getTriggeredAIWorkContext(
  options: AIEmployeeTaskTrigger,
  task: AIEmployeeTask | undefined,
  inheritedContext: AIWorkContextItem[]
) {
  const taskContext = task?.message?.workContext ?? [];
  return taskContext.length
    ? taskContext
    : options.context?.length
    ? options.context
    : inheritedContext;
}

export function createAIChatTaskRuntime(
  task: AIEmployeeTask | undefined,
  workContext: AIWorkContextItem[]
): AIChatTaskRuntime {
  const requiredTools = getAIWorkContextRequiredTools(workContext);
  return task
    ? {
        systemMessage: task.message?.system,
        workContext: [],
        skillSettings: mergeAIRequiredTools(task.skillSettings, requiredTools),
        webSearch: task.webSearch,
      }
    : {
        workContext: [],
        skillSettings: mergeAIRequiredTools(undefined, requiredTools),
      };
}

export function findAIChatTaskModel(
  models: AIModel[],
  task: AIEmployeeTask | undefined
) {
  return task?.model
    ? models.find(
        (item) =>
          item.value === task.model?.model &&
          (!task.model.llmService ||
            item.llmService === task.model.llmService)
      )
    : undefined;
}
