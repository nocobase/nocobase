import {
  MAX_EFFORT_LENGTH,
  MAX_MODEL_EFFORTS,
  MAX_MODEL_ID_LENGTH,
  MAX_TOOL_MODELS,
  createRedactor,
  type ToolModel,
} from '@nocobase/agent-protocol';

const redactor = createRedactor();
function identifier(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= max &&
    /^[a-zA-Z0-9][a-zA-Z0-9._:/+-]*$/.test(value) &&
    !value.includes('://') &&
    redactor.text(value) === value
  );
}

/** Project only identifiers, discard suspicious/oversized values and deduplicate before transmission. */
export function boundedModels(
  models: readonly { id: unknown; efforts?: readonly unknown[] }[],
): ToolModel[] {
  const result = new Map<string, ToolModel>();
  for (const model of models) {
    if (!identifier(model.id, MAX_MODEL_ID_LENGTH)) continue;
    const efforts =
      model.efforts === undefined
        ? undefined
        : [
            ...new Set(
              model.efforts.filter((effort): effort is string =>
                identifier(effort, MAX_EFFORT_LENGTH),
              ),
            ),
          ].slice(0, MAX_MODEL_EFFORTS);
    const previous = result.get(model.id);
    const merged =
      previous?.efforts === undefined
        ? efforts
        : [...new Set([...previous.efforts, ...(efforts ?? [])])].slice(
            0,
            MAX_MODEL_EFFORTS,
          );
    result.set(model.id, {
      id: model.id,
      ...(merged === undefined ? {} : { efforts: merged }),
    });
    if (result.size >= MAX_TOOL_MODELS) break;
  }
  return [...result.values()];
}
