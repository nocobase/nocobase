import { FormatVariableScopeParam, FormatVariableScopeReturn } from '../VariableInput';

export function formatVariableScop(variableScop: FormatVariableScopeParam[]): FormatVariableScopeReturn[] {
  return variableScop.map((item) => {
    return {
      ...item,
      value: item.name,
      key: item.name,
      label: item.title,
      disabled: item.disabled,
      children: item.children ? formatVariableScop(item.children) : undefined,
    };
  });
}
