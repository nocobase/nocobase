/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { composeTemplate, extractTemplateElements, Helper } from '@nocobase/json-template-parser';
import { get, isArray } from 'lodash';
import minimatch from 'minimatch';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalVariables, useVariableEvaluateContext, useVariables } from '../../../variables';
import { dateVarsMap } from '../../../variables/date';
import { useHelperObservables } from './Helpers/hooks/useHelperObservables';
interface VariableContextValue {
  value: any;
  helperObservables?: ReturnType<typeof useHelperObservables>;
  variableType: string;
  valueType: string;
  variableName: string;
  openLastHelper?: boolean;
}

interface VariableProviderProps {
  variableName: string;
  variableType: string | null;
  openLastHelper?: boolean;
  children: React.ReactNode;
  helperObservables: ReturnType<typeof useHelperObservables>;
  onVariableTemplateChange?: (val) => void;
}

export interface VariableHelperRule {
  /** Pattern to match variables, supports glob patterns */
  variable: string;
  /** Array of allowed filter patterns, supports glob patterns */
  helpers: string[];
}

export interface VariableHelperMapping {
  /** Array of rules defining which filters are allowed for which variables */
  rules: VariableHelperRule[];
  /** Optional flag to determine if unlisted combinations should be allowed */
  strictMode?: boolean;
}

/**
 * Escapes special glob characters in a string
 * @param str The string to escape
 * @returns The escaped string
 */
function escapeGlob(str: string): string {
  return str.replace(/[?$[\](){}!|+@\\]/g, '\\$&');
}

/**
 * Tests if a filter is allowed for a given variable based on the variableHelperMapping configuration
 * @param variableName The name of the variable to test
 * @param helperName The name of the filter to test
 * @param mapping The variable helper mapping configuration
 * @returns boolean indicating if the filter is allowed for the variable
 */
export function isHelperAllowedForVariable(helperName: string, valueType: string): boolean {
  if (valueType) {
    const matched = minimatch(helperName, `${valueType}.*`);
    return matched;
  }
  // If no matching rule found and strictMode is true, deny the filter
  return false;
}

/**
 * Gets all supported filters for a given variable based on the mapping rules
 * @param variableName The name of the variable to check
 * @param mapping The variable helper mapping configuration
 * @param allHelpers Array of all available filter names
 * @returns Array of filter names that are allowed for the variable
 */
export function getSupportedFiltersForVariable(
  variableName: string,
  mapping?: VariableHelperMapping,
  allHelpers: Helper[] = [],
): Helper[] {
  if (!mapping?.rules) {
    return allHelpers; // If no rules defined, all filters are allowed
  }

  // Find matching rule for the variable
  const matchingRule = mapping.rules.find((rule) => minimatch(escapeGlob(variableName), rule.variable));

  if (!matchingRule) {
    // If no matching rule and strictMode is true, return empty array
    // Otherwise return all filters
    return allHelpers;
  }

  // Filter the allFilters array based on the matching rule's filter patterns
  return allHelpers.filter(({ name }) => matchingRule.helpers.some((pattern) => minimatch(name, pattern)));
}

const VariableContext = createContext<VariableContextValue>({
  variableName: '',
  value: null,
  variableType: null,
  valueType: '',
  openLastHelper: false,
});

export function useCurrentVariable(): VariableContextValue {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error('useCurrentVariable must be used within a VariableProvider');
  }
  return context;
}

const _VariableProvider: React.FC<VariableProviderProps> = ({
  variableName,
  children,
  variableType,
  openLastHelper,
  helperObservables,
  onVariableTemplateChange,
}) => {
  const [value, setValue] = useState(null);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  isArray(localVariables) ? localVariables : [localVariables];
  const { getValue } = useVariableEvaluateContext();
  useEffect(() => {
    const dispose = reaction(
      () => {
        return composeTemplate({ fullVariable: variableName, helpers: helperObservables.helpersObs.value });
      },
      (newVal) => {
        onVariableTemplateChange(newVal);
      },
    );
    return dispose;
  }, [variableName, onVariableTemplateChange, helperObservables.helpersObs.value]);
  useEffect(() => {
    async function fetchValue() {
      try {
        const val = await getValue(variableName);
        if (val) {
          setValue(val);
        } else {
          const result = await variables.getVariableValue(variableName, localVariables);
          setValue(result.value);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchValue();
  }, [localVariables, variableName, variables, getValue]);

  const valueType =
    helperObservables.helpersObs.value.length > 0
      ? helperObservables.helpersObs.value[helperObservables.helpersObs.value.length - 1].config.outputType
      : variableType;

  return (
    <VariableContext.Provider
      value={{ variableName, value, valueType, helperObservables, variableType, openLastHelper }}
    >
      {children}
    </VariableContext.Provider>
  );
};

export const VariableProvider = observer(_VariableProvider, { displayName: 'VariableProvider' });

export function useVariable() {
  const context = useContext(VariableContext);
  const { value, variableName, valueType } = context;

  const isHelperAllowed = (helperName: string) => {
    return isHelperAllowedForVariable(helperName, valueType);
  };

  return {
    ...context,
    isHelperAllowed,
  };
}
