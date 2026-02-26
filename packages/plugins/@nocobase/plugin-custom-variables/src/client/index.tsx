/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { isVariable, Plugin, useAPIClient, useApp, useLocalVariablesWithoutCustomVariable, useVariables } from '@nocobase/client';
import { flatten } from '@nocobase/utils/client';
import React, { useCallback, useEffect, useMemo } from 'react';
import { AddVariableButton } from './AddVariableButton';
import EditBadge from './EditBadge';
import { useCustomVariablesOptions } from './useCustomVariablesOptions';
import { variableInitializer } from './variableInitializer';
import { NAMESPACE } from '../locale';
import { useTranslation } from 'react-i18next';

class PluginCustomVariablesClient extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(variableInitializer);

    // Add Edit badge setting to menuSettings:menuItem
    this.app.schemaSettingsManager.addItem('menuSettings:menuItem', 'badge', {
      Component: EditBadge,
      sort: 401,
    });

    this.app.schemaSettingsManager.addItem('PageTabSettings', 'badge', {
      Component: EditBadge,
      sort: 201,
    });

    this.app.apiClient.axios.interceptors.response.use((response) => {
      const url = response.config.url.split('?')[0];
      this.app.eventBus.dispatchEvent(new CustomEvent(`collection:${url}`));
      return response;
    });

    this.app.registerVariable({
      name: '$customVariables',
      useOption() {
        const { options, refresh, loading } = useCustomVariablesOptions();
        const { t } = useTranslation(NAMESPACE);
        const option = useMemo(() => {
          return {
            label: t("Custom Variables"),
            value: '$customVariables',
            children: [
              ...options,
              {
                label: <AddVariableButton onSuccess={refresh} />,
                disabled: true,
                value: 'none',
              }
            ],
          };
        }, [options, refresh]);

        return useMemo(() => {
          return {
            option,
            visible: !loading,
          };
        }, [option, loading]);
      },
      useCtx() {
        const api = useAPIClient();
        const app = useApp();
        const localVariablesWithoutCustomVariable = useLocalVariablesWithoutCustomVariable();
        const variables = useVariables();
        const [refreshId, setRefreshId] = React.useState(0);
        // Use ref to track added event names
        const eventNamesRef = React.useRef<Set<string>>(new Set());

        const refresh = useCallback(() => {
          setRefreshId((id) => id + 1);
        }, []);

        const getFilterCtx = useCallback(async (filter) => {
          const ctx = {};
          flatten(filter, {
            breakOn({ key }) {
              return key.startsWith('$') && key !== '$and' && key !== '$or';
            },
            transformValue(value) {
              if (!isVariable(value)) {
                return value;
              }
              const result = variables?.parseVariable(value, localVariablesWithoutCustomVariable).then(({ value }) => value);
              ctx[value] = result;
              return result;
            },
          });

          const keys = Object.keys(ctx);
          const values = await Promise.all(keys.map((key) => ctx[key]));

          values.forEach((value, index) => {
            ctx[keys[index]] = value;
          });

          return ctx;
        }, [localVariablesWithoutCustomVariable, variables?.parseVariable]);

        // Clean up all registered event listeners
        useEffect(() => {
          return () => {
            // Remove all event listeners when component unmounts
            eventNamesRef.current.forEach(eventName => {
              app.eventBus.removeEventListener(eventName, refresh);
            });
          }
        }, []);

        return useMemo(() => {
          return async ({ variableName }) => {
            const name = variableName.replace('$customVariables.', '');
            const response = await api.request({
              url: `customVariables:get?filter[name]=${name}`,
              method: 'GET',
            });

            if (!response?.data?.data) {
              throw new Error(`Custom variable "${name}" not found. It may have been deleted.`);
            }

            const variable = response.data.data;
            const filterCtx = await getFilterCtx(variable.options.params.filter);

            // Define event names to listen to
            const eventNames = [
              `collection:${variable.options.collection}:create`,
              `collection:${variable.options.collection}:update`,
              `collection:${variable.options.collection}:destroy`
            ];

            // Remove previously added event listeners first
            eventNamesRef.current.forEach(eventName => {
              app.eventBus.removeEventListener(eventName, refresh);
            });

            // Add new event listeners
            eventNames.forEach(eventName => {
              eventNamesRef.current.add(eventName);
              app.eventBus.addEventListener(eventName, refresh);
            });

            const { data } = await api.request({ url: `customVariables:parse?name=${name}`, method: 'POST', data: { filterCtx } });

            return data?.data;
          };
        }, [refreshId]);
      },
    });
  }
}

export default PluginCustomVariablesClient;
