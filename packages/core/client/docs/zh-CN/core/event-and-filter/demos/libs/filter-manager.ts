/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterContext, FilterFunction, FilterOptions, UnregisterFunction } from './types';

interface RegisteredFilter {
  name: string;
  filter: FilterFunction;
  options: FilterOptions;
}

export class FilterManager {
  private filters = new Map<string, RegisteredFilter[]>();

  /**
   * Adds a filter function for a given name
   */
  addFilter(name: string, filter: FilterFunction, options: FilterOptions = {}): UnregisterFunction {
    const registeredFilter: RegisteredFilter = {
      name,
      filter,
      options: {
        priority: options.priority ?? 0,
      },
    };

    if (!this.filters.has(name)) {
      this.filters.set(name, []);
    }

    this.filters.get(name).push(registeredFilter);

    // Return unregister function
    return () => this.removeFilter(name, filter);
  }

  /**
   * Removes a specific filter function or all filters for a name
   */
  removeFilter(name: string, filter?: FilterFunction): void {
    if (!this.filters.has(name)) {
      return;
    }

    if (filter) {
      // Remove specific filter
      const filters = this.filters.get(name);
      const newFilters = filters.filter((registered) => registered.filter !== filter);

      if (newFilters.length === 0) {
        this.filters.delete(name);
      } else {
        this.filters.set(name, newFilters);
      }
    } else {
      // Remove all filters for this name
      this.filters.delete(name);
    }
  }

  /**
   * Applies all registered filters for a name to an initial value
   */
  async applyFilter(name: string, initialValue: any, context: FilterContext): Promise<any> {
    if (!this.filters.has(name)) {
      return initialValue;
    }

    try {
      // Get all filters for this name and sort by priority
      const filters = [...this.filters.get(name)].sort((a, b) => (a.options.priority || 0) - (b.options.priority || 0));

      // Apply each filter in sequence
      let currentValue = initialValue;

      for (const { filter, options } of filters) {
        try {
          const result = filter(currentValue, context);

          // Handle async filter functions
          if (result instanceof Promise) {
            currentValue = await result;
          } else {
            currentValue = result;
          }
        } catch (error) {
          // Add context to the error
          const contextualizedError = new Error(
            `Filter error in '${name}' (priority: ${options.priority}): ${error.message}`,
          );
          (contextualizedError as any).originalError = error;
          (contextualizedError as any).filterName = name;
          (contextualizedError as any).filterPriority = options.priority;

          console.error(contextualizedError);
          throw contextualizedError;
        }
      }

      return currentValue;
    } catch (error) {
      console.error(`Error applying filter chain '${name}':`, error);
      throw error;
    }
  }
}
