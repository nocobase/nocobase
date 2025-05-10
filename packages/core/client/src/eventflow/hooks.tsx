/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useCallback } from 'react';
import { EventListener, EventListenerOptions } from './types';
import { useFieldSchema } from '@formily/react';
import { defaultListenerCondition } from './event-bus';
import { EventBus } from './event-bus';
import { uid } from '@nocobase/utils/client';
import { createStyles } from 'antd-style';

const eventBus = new EventBus();

// /**
//  * Hook for registering a filter function that will be automatically unregistered on component unmount
//  *
//  * @param name - Filter name to register with
//  * @param filter - Filter function
//  * @param options - Filter options
//  * @param deps - Dependency array for memoizing the filter function
//  */
// export function useAddFilter(name: string, filter: FilterFunction, options: FilterOptions = {}, deps: any[] = []) {
//   // Memoize the filter function based on deps
//   const memoizedFilter = useCallback(filter, [filter, ...deps]);

//   useEffect(() => {
//     // Register the filter on mount
//     const unregister = filterManager.addFilter(name, memoizedFilter, options);

//     // Unregister on unmount
//     return unregister;
//   }, [name, memoizedFilter, options]);
// }

// /**
//  * Hook that returns a function that will apply filters to a given value
//  *
//  * @param name - Filter name to apply
//  * @param options - Apply filter options
//  * @returns A function that applies the filter and returns a Promise
//  */

// export const useApplyFilter = (name: string, options: ApplyFilterOptions) => {
//   const { input, props } = options;
//   const fieldSchema = useFieldSchema();
//   const [done, setDone] = useState(false);
//   const [result, setResult] = useState(null);
//   const resource = useBlockResource();

//   useEffect(() => {
//     const ctx: FilterContext = {
//       settings: fieldSchema['x-component-settings'],
//       resource,
//       props,
//       resourceParams: {
//         page: fieldSchema?.['x-decorator-props']?.page,
//         pageSize: fieldSchema?.['x-decorator-props']?.pageSize,
//       },
//       _cancel: false,
//     };
//     filterManager
//       .applyFilter(name, input, ctx)
//       .then((ret) => {
//         if (!ctx._cancel) {
//           setResult(ret);
//           setDone(true);
//         }
//       })
//       .catch((error) => {
//         if (!ctx._cancel) {
//           console.error('Error applying filter:', error);
//         }
//       });

//     return () => {
//       ctx._cancel = true;
//     };
//   }, [name, input, fieldSchema, props, resource]);

//   return { done, result };
// };

export function useAddEventListener(event: string | string[], handler: EventListener, options?: EventListenerOptions) {
  const fieldSchema = useFieldSchema();

  useEffect(() => {
    const unsubscribe = eventBus.on(event, handler, {
      condition: defaultListenerCondition,
      id: fieldSchema.toJSON()?.['x-uid'] || uid(),
      ...options,
    });
    return unsubscribe;
  }, [handler, event, fieldSchema, options]);
}

/**
 * Hook that returns a function that will dispatch an event
 *
 * @returns A function that dispatches events
 */
export function useDispatchEvent() {
  return useCallback(async (eventName: string | string[], ctx: any) => {
    return eventBus.dispatchEvent(eventName, ctx);
  }, []);
}

export const useTabulatorBuiltinStyles = () => {
  useEffect(() => {
    // Check if the link already exists
    const existingLink = document.querySelector(`link[href*="tabulator.min.css"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);
};

export const useTabulatorStyles = createStyles(({ css, token }) => {
  return {
    tabulatorWrapper: css`
      width: 100%;
      overflow: auto;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: ${token.borderRadiusLG}px;
      background-color: ${token.colorBgContainer};

      .tabulator {
        border: none;
        background-color: transparent;

        .tabulator-header {
          border-bottom: 1px solid ${token.colorBorderSecondary};
          background-color: ${token.colorFillAlter};

          .tabulator-col {
            background-color: transparent;
            border-right: 1px solid ${token.colorBorderSecondary};

            &:last-child {
              border-right: none;
            }

            .tabulator-col-content {
              padding: 8px;

              .tabulator-col-title {
                font-weight: 500;
              }

              .tabulator-arrow {
                border-bottom-color: ${token.colorTextSecondary};
              }
            }

            &.tabulator-sortable[aria-sort='ascending'] .tabulator-col-content .tabulator-arrow {
              border-bottom-color: ${token.colorPrimary};
            }

            &.tabulator-sortable[aria-sort='descending'] .tabulator-col-content .tabulator-arrow {
              border-top-color: ${token.colorPrimary};
              border-bottom: none;
            }
          }
        }

        .tabulator-tableHolder {
          .tabulator-table {
            .tabulator-row {
              border-bottom: 1px solid ${token.colorBorderSecondary};
              transition: background-color 0.2s ease;

              &:last-child {
                border-bottom: none;
              }

              &.tabulator-row-even {
                background-color: ${token.colorFillAlter};
              }

              &.tabulator-selected {
                background-color: ${token.colorPrimaryBg};
              }

              &.tabulator-row-highlighted {
                background-color: ${token.colorWarningBg};
                transition: background-color 0.3s ease;
              }

              &.tabulator-row-hover-effect {
                background-color: ${token.colorInfoBg};
                transition: background-color 0.2s ease;
              }

              .tabulator-cell {
                padding: 8px;
                border-right: 1px solid ${token.colorBorderSecondary};
                transition: background-color 0.2s ease;

                &:last-child {
                  border-right: none;
                }

                &.tabulator-cell-highlighted {
                  background-color: ${token.colorInfoBg};
                  transition: background-color 0.3s ease;
                }

                &.tabulator-editing {
                  border: 1px solid ${token.colorPrimary};
                  background-color: ${token.colorBgContainer};
                  padding: 0;

                  input,
                  select,
                  textarea {
                    border: none;
                    outline: none;
                    width: 100%;
                    height: 100%;
                    padding: 7px;
                    box-sizing: border-box;
                    font-family: inherit;
                    font-size: inherit;
                  }
                }
              }
            }
          }
        }

        .tabulator-footer {
          background-color: ${token.colorFillAlter};
          border-top: 1px solid ${token.colorBorderSecondary};

          .tabulator-paginator {
            .tabulator-page {
              border: 1px solid ${token.colorBorderSecondary};
              background-color: ${token.colorBgContainer};
              color: ${token.colorText};
              border-radius: ${token.borderRadiusSM}px;
              margin: 0 2px;

              &.active {
                background-color: ${token.colorPrimary};
                color: ${token.colorTextLightSolid};
                border-color: ${token.colorPrimary};
              }
            }
          }
        }
      }
    `,
    container: css`
      width: 100%;
    `,
  };
});
