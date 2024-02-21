export function mergeOptions(fieldOptions, modelOptions) {
  const newOptions = {
    ...fieldOptions,
    ...modelOptions,
  };

  for (const key of Object.keys(modelOptions)) {
    if (modelOptions[key] === null && fieldOptions[key]) {
      newOptions[key] = fieldOptions[key];
    }
  }
  return newOptions;
}
