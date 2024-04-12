import { useContext } from 'react';
import { DeclareVariableContext } from './DeclareVariable';

/**
 * 获取对应标识符的变量值，及其它信息
 * @param variableName
 * @returns
 */
export const useVariable = (variableName: string) => {
  const { name, value, title, collection } = useContext(DeclareVariableContext);
  if (name === variableName) {
    return { value, title, collection };
  }
  return {};
};
