import type { AIEmployee, AIModel } from './types.js';

export type AIModelGroup = {
  key: string;
  label: string;
  models: AIModel[];
};

export function getAIModelKey(model: AIModel) {
  return model.llmService ? `${model.llmService}:${model.value}` : model.value;
}

export function findAIModel(models: AIModel[], key: string) {
  return models.find((model) => getAIModelKey(model) === key);
}

export function groupAIModels(models: AIModel[]): AIModelGroup[] {
  const groups = new Map<string, AIModelGroup>();

  for (const model of models) {
    const key = model.llmService ?? '__models__';
    const group = groups.get(key) ?? {
      key,
      label: model.llmServiceTitle ?? model.llmService ?? 'Models',
      models: [],
    };
    group.models.push(model);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

/**
 * The models this employee may run on: those it lists that are enabled, in
 * the order it lists them. The server makes the same choice, so the chat
 * shows and sends from the same list rather than displaying one model and
 * getting an answer from another. An employee without its own model settings
 * uses every enabled model; one whose listed models are all disabled has none,
 * and the chat cannot send until one is enabled again.
 */
export function getEmployeeModels(
  models: AIModel[],
  employee?: AIEmployee,
): AIModel[] {
  const settings = employee?.modelSettings;
  if (!settings?.enabled) return models;
  const allowed = (settings.models ?? []).filter(
    (item) => item?.llmService && item?.model,
  );
  if (!allowed.length && settings.llmService && settings.model) {
    allowed.push({ llmService: settings.llmService, model: settings.model });
  }
  const available = allowed.flatMap((item) => {
    const model = models.find(
      (candidate) =>
        candidate.value === item.model &&
        candidate.llmService === item.llmService,
    );
    return model ? [model] : [];
  });
  return available;
}

/** The model to show and send for this employee: the selection if allowed. */
export function resolveEmployeeModel(
  models: AIModel[],
  employee: AIEmployee | undefined,
  key: string,
): AIModel | undefined {
  const allowed = getEmployeeModels(models, employee);
  return findAIModel(allowed, key) ?? allowed[0];
}
