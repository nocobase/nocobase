import { useEffect, useState } from "react";
import { isVariable, useLocalVariables, useVariables } from "../variables";

export const useParsedValue = (variableString: string) => {
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const [parsedValue, setParsedValue] = useState<number | string>();

  useEffect(() => {
    if (isVariable(variableString)) {
      variables.parseVariable(variableString, localVariables).then(({ value }) => {
        setParsedValue(value);
      })
    } else {
      setParsedValue(variableString);
    }
  }, [variables.parseVariable, variableString, localVariables]);

  return parsedValue;
}
