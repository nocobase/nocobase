/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Helper } from '@nocobase/json-template-parser';
import { isArray } from 'lodash';
import minimatch from 'minimatch';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalVariables, useVariables } from '../../../variables';
import { useHelperObservables } from './Helpers/hooks/useHelperObservables';
interface VariableContextValue {
  value: any;
  helperObservables?: ReturnType<typeof useHelperObservables>;
  variableHelperMapping: VariableHelperMapping;
  variableName: string;
}

interface VariableProviderProps {
  variableName: string;
  children: React.ReactNode;
  variableHelperMapping?: VariableHelperMapping;
  helperObservables?: ReturnType<typeof useHelperObservables>;
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
export function isHelperAllowedForVariable(
  variableName: string,
  helperName: string,
  mapping?: VariableHelperMapping,
): boolean {
  if (!mapping?.rules) {
    return true; // If no rules defined, allow all filters
  }

  // Check each rule
  for (const rule of mapping.rules) {
    // Check if variable matches the pattern
    // We don't escape the pattern since it's meant to be a glob pattern
    // But we escape the variable name since it's a literal value
    const matched = minimatch(variableName, rule.variable);
    if (matched) {
      // Check if filter matches any of the allowed patterns
      return rule.helpers.some((pattern) => minimatch(helperName, pattern));
    }
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
  variableHelperMapping: { rules: [] },
});

export function useCurrentVariable(): VariableContextValue {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error('useCurrentVariable must be used within a VariableProvider');
  }
  return context;
}

export const VariableProvider: React.FC<VariableProviderProps> = ({
  variableName,
  children,
  variableHelperMapping,
}) => {
  const [value, setValue] = useState(null);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const helperObservables = useHelperObservables();
  isArray(localVariables) ? localVariables : [localVariables];
  useEffect(() => {
    async function fetchValue() {
      try {
        const result = await variables.getVariableValue(variableName, localVariables);
        setValue(result.value);
      } catch (error) {
        console.error(error);
      }
    }
    fetchValue();
  }, [localVariables, variableName, variables]);

  return (
    <VariableContext.Provider value={{ variableName, value, helperObservables, variableHelperMapping }}>
      {children}
    </VariableContext.Provider>
  );
};

export function useVariable() {
  const context = useContext(VariableContext);
  const { value, variableName, variableHelperMapping } = context;

  const isHelperAllowed = (filterName: string) => {
    return isHelperAllowedForVariable(variableName, filterName, variableHelperMapping);
  };

  const getSupportedFilters = (allHelpers: Helper[]) => {
    return getSupportedFiltersForVariable(variableName, variableHelperMapping, allHelpers);
  };

  return {
    ...context,
    isHelperAllowed,
    getSupportedFilters,
  };
}
