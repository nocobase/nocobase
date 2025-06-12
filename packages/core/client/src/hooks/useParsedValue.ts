import { useEffect, useState } from "react";
import { useLocalVariables, useVariables } from "../variables";
import { replaceVariables } from "../schema-settings";
import { evaluators } from '@nocobase/evaluators/client';

const { evaluate } = evaluators.get('formula.js');

export const useEvaluatedExpression = (expression: string) => {
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const [parsedValue, setParsedValue] = useState<number | string>();

  useEffect(() => {
    const run = async () => {
      if (expression == null || expression === '') {
        setParsedValue(undefined);
        return;
      }

      const { exp, scope: expScope } = await replaceVariables(expression, {
        variables,
        localVariables,
      });

      try {
        const result = evaluate(exp, { now: () => new Date().toString(), ...expScope });
        setParsedValue(result);
      } catch (error) {
        console.error(error);
      }
    }

    run();
  }, [variables.parseVariable, expression, localVariables]);

  return parsedValue;
}
