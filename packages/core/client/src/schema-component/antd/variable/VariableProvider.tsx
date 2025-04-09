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
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalVariables, useVariableEvaluateContext, useVariables } from '../../../variables';
import { dateVarsMap } from '../../../variables/date';
import { useHelperObservables } from './Helpers/hooks/useHelperObservables';
interface VariableContextValue {
  value: any;
  helperObservables?: ReturnType<typeof useHelperObservables>;
  helpersMappingRules: string[];
  currentMappingRules: string[];
  variableName: string;
  openLastHelper?: boolean;
}

interface VariableProviderProps {
  variableName: string;
  variableExampleValue?: any;
  helpersMappingRules: string[] | null;
  openLastHelper?: boolean;
  children: React.ReactNode;
  helperObservables: ReturnType<typeof useHelperObservables>;
  onVariableTemplateChange?: (val) => void;
}

export interface VariableHelperRule {
  /** Pattern to match variables, supports glob patterns */
  variable: string;
  /** Array of allowed helper patterns, supports glob patterns */
  helpers: string[];
}

export interface VariableHelperMapping {
  /** Array of rules defining which helpers are allowed for which variables */
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
 * Tests if a helper is allowed for a given variable based on the variableHelperMapping configuration
 * @param variableName The name of the variable to test
 * @param helperName The name of the helper to test
 * @param mapping The variable helper mapping configuration
 * @returns boolean indicating if the helper is allowed for the variable
 */
export function isHelperAllowedForVariable(helperName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const matched = minimatch(helperName, pattern);
    return matched;
  });
}

/**
 * Gets all supported helpers for a given variable based on the mapping rules
 * @param variableName The name of the variable to check
 * @param mapping The variable helper mapping configuration
 * @param allHelpers Array of all available helper names
 * @returns Array of helper names that are allowed for the variable
 */
export function getSupportedHelpersForVariable(
  variableName: string,
  mapping?: VariableHelperMapping,
  allHelpers: Helper[] = [],
): Helper[] {
  if (!mapping?.rules) {
    return allHelpers; // If no rules defined, all helpers are allowed
  }

  // Find matching rule for the variable
  const matchingRule = mapping.rules.find((rule) => minimatch(escapeGlob(variableName), rule.variable));

  if (!matchingRule) {
    // If no matching rule and strictMode is true, return empty array
    // Otherwise return all helpers
    return allHelpers;
  }

  // Filter the allHelpers array based on the matching rule's helper patterns
  return allHelpers.filter(({ name }) => matchingRule.helpers.some((pattern) => minimatch(name, pattern)));
}

const VariableContext = createContext<VariableContextValue>({
  variableName: '',
  value: null,
  helpersMappingRules: [],
  currentMappingRules: [],
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
  helpersMappingRules = [],
  variableExampleValue,
  openLastHelper,
  helperObservables,
  onVariableTemplateChange,
}) => {
  const [variableValue, setValue] = useState(null);
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
        if (variableExampleValue !== undefined) {
          setValue(variableExampleValue);
          return;
        }
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
  }, [localVariables, variableName, variables, getValue, variableExampleValue]);

  const currentMappingRules =
    helperObservables.helpersObs.value.length > 0
      ? helperObservables.helpersObs.value[helperObservables.helpersObs.value.length - 1].config.outputMappingRules
      : helpersMappingRules;
  const variableValueAppliedHelpers = useMemo(() => {
    const value = helperObservables.helpersObs.value.reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, variableValue);
    return typeof value === 'string' ? value : value?.toString();
  }, [variableValue, helperObservables.helpersObs.value]);

  return (
    <VariableContext.Provider
      value={{
        variableName,
        value: variableValueAppliedHelpers,
        helperObservables,
        helpersMappingRules,
        openLastHelper,
        currentMappingRules,
      }}
    >
      {children}
    </VariableContext.Provider>
  );
};

export const VariableProvider = observer(_VariableProvider, { displayName: 'VariableProvider' });

export function useVariable() {
  const context = useContext(VariableContext);
  const { currentMappingRules } = context;

  const isHelperAllowed = (helperName: string) => {
    return isHelperAllowedForVariable(helperName, currentMappingRules);
  };

  return {
    ...context,
    isHelperAllowed,
  };
}

export function getFieldSupportedHelpers(fieldSchema: any): string[] {
  if (!fieldSchema) {
    return [];
  }
  if (['datetimeNoTz', 'date'].includes(fieldSchema?.type)) {
    return ['date.*'];
  }
}
