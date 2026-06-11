/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const ROW_SELECTOR = 'tr[data-param-name][data-param-in]';
const INPUT_SELECTOR = 'input, textarea';
const RECENT_INPUT_TTL = 2000;

type InputLike = HTMLInputElement | HTMLTextAreaElement;

type ParameterIdentity = {
  paramName: string;
  paramIn: string;
};

type SwaggerParameter = {
  get?: (key: string) => unknown;
};

type SwaggerSystem = {
  specActions?: {
    changeParam?: (path: unknown, paramName: string, paramIn: string, value: unknown, isXml?: boolean) => unknown;
  };
};

type ChangeParamByIdentityAction = (path: unknown, param: SwaggerParameter, value: unknown, isXml?: boolean) => unknown;

function getInputIdentity(input: InputLike): ParameterIdentity | null {
  const row = input.closest(ROW_SELECTOR);
  const paramName = row?.getAttribute('data-param-name');
  const paramIn = row?.getAttribute('data-param-in');

  if (!paramName || !paramIn) {
    return null;
  }

  return {
    paramName,
    paramIn,
  };
}

function getParameterIdentity(param: SwaggerParameter | undefined): ParameterIdentity | null {
  const paramName = param?.get?.('name');
  const paramIn = param?.get?.('in');

  if (typeof paramName !== 'string' || typeof paramIn !== 'string') {
    return null;
  }

  return {
    paramName,
    paramIn,
  };
}

function normalizeValue(value: unknown) {
  return value == null ? '' : String(value);
}

export function createSwaggerParameterValuePlugin(root: HTMLElement) {
  let lastEditedParameter: (ParameterIdentity & { value: string; updatedAt: number }) | null = null;

  const updateLastEditedParameter = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const identity = getInputIdentity(target);
    if (!identity) return;

    lastEditedParameter = {
      ...identity,
      value: target.value,
      updatedAt: Date.now(),
    };
  };

  const getActiveInputIdentity = (value: unknown): ParameterIdentity | null => {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
      return null;
    }
    if (!root.contains(activeElement)) {
      return null;
    }
    if (activeElement.value !== normalizeValue(value)) {
      return null;
    }

    return getInputIdentity(activeElement);
  };

  const getRecentInputIdentity = (value: unknown): ParameterIdentity | null => {
    if (!lastEditedParameter) return null;
    if (Date.now() - lastEditedParameter.updatedAt > RECENT_INPUT_TTL) return null;
    if (lastEditedParameter.value !== normalizeValue(value)) return null;

    return {
      paramName: lastEditedParameter.paramName,
      paramIn: lastEditedParameter.paramIn,
    };
  };

  root.addEventListener('input', updateLastEditedParameter, true);
  root.addEventListener('change', updateLastEditedParameter, true);

  return {
    plugin: () => ({
      statePlugins: {
        spec: {
          wrapActions: {
            changeParamByIdentity:
              (originalAction: ChangeParamByIdentityAction, system: SwaggerSystem) =>
              (path: unknown, param: SwaggerParameter, value: unknown, isXml?: boolean) => {
                const identity =
                  getActiveInputIdentity(value) || getRecentInputIdentity(value) || getParameterIdentity(param);

                if (identity && system?.specActions?.changeParam) {
                  return system.specActions.changeParam(path, identity.paramName, identity.paramIn, value, isXml);
                }

                return originalAction(path, param, value, isXml);
              },
          },
        },
      },
    }),
    dispose: () => {
      root.removeEventListener('input', updateLastEditedParameter, true);
      root.removeEventListener('change', updateLastEditedParameter, true);
    },
  };
}
