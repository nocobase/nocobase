import type { AIModel } from "./types";

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
    const key = model.llmService ?? "__models__";
    const group = groups.get(key) ?? {
      key,
      label: model.llmServiceTitle ?? model.llmService ?? "Models",
      models: [],
    };
    group.models.push(model);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}
