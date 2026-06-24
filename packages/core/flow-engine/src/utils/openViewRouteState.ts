/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const OPEN_VIEW_ROUTE_MODES = ['drawer', 'dialog', 'embed'] as const;
const OPEN_VIEW_ROUTE_SIZES = ['small', 'medium', 'large'] as const;
const OPEN_VIEW_ROUTE_STATE_TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const OPEN_VIEW_ROUTE_STATE_TOKEN_LENGTH = 8;

export type OpenViewRouteMode = (typeof OPEN_VIEW_ROUTE_MODES)[number];
export type OpenViewRouteSize = (typeof OPEN_VIEW_ROUTE_SIZES)[number];

export type OpenViewRouteState = {
  mode?: OpenViewRouteMode;
  size?: OpenViewRouteSize;
};

export const RUNJS_OPEN_VIEW_ROUTE_STATE = Symbol.for('nocobase.runjs.openViewRouteState');

function isOpenViewRouteMode(value: unknown): value is OpenViewRouteMode {
  return typeof value === 'string' && (OPEN_VIEW_ROUTE_MODES as readonly string[]).includes(value);
}

function isOpenViewRouteSize(value: unknown): value is OpenViewRouteSize {
  return typeof value === 'string' && (OPEN_VIEW_ROUTE_SIZES as readonly string[]).includes(value);
}

export function createOpenViewRouteState(input?: { mode?: unknown; size?: unknown }): OpenViewRouteState | undefined {
  const state: OpenViewRouteState = {};

  if (isOpenViewRouteMode(input?.mode)) {
    state.mode = input.mode;
  }
  if (isOpenViewRouteSize(input?.size)) {
    state.size = input.size;
  }

  return state.mode || state.size ? state : undefined;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stateToCode(state: OpenViewRouteState) {
  const modeIndex = state.mode ? OPEN_VIEW_ROUTE_MODES.indexOf(state.mode) + 1 : 0;
  const sizeIndex = state.size ? OPEN_VIEW_ROUTE_SIZES.indexOf(state.size) + 1 : 0;
  const code = modeIndex * 4 + sizeIndex;
  return code > 0 ? code : undefined;
}

function codeToState(code: number): OpenViewRouteState | undefined {
  const modeIndex = Math.floor(code / 4);
  const sizeIndex = code % 4;
  return createOpenViewRouteState({
    mode: modeIndex ? OPEN_VIEW_ROUTE_MODES[modeIndex - 1] : undefined,
    size: sizeIndex ? OPEN_VIEW_ROUTE_SIZES[sizeIndex - 1] : undefined,
  });
}

function tokenForCode(viewUid: string, code: number) {
  let seed = hashString(`${viewUid}:${code}`);
  let token = '';
  for (let i = 0; i < OPEN_VIEW_ROUTE_STATE_TOKEN_LENGTH; i++) {
    seed = Math.imul(seed ^ (code + i * 17), 16777619) >>> 0;
    token += OPEN_VIEW_ROUTE_STATE_TOKEN_ALPHABET[seed % OPEN_VIEW_ROUTE_STATE_TOKEN_ALPHABET.length];
  }
  return token;
}

export function isOpenViewRouteStateToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === OPEN_VIEW_ROUTE_STATE_TOKEN_LENGTH &&
    [...value].every((char) => OPEN_VIEW_ROUTE_STATE_TOKEN_ALPHABET.includes(char))
  );
}

export function encodeOpenViewRouteState(viewUid: string, input?: { mode?: unknown; size?: unknown }) {
  const state = createOpenViewRouteState(input);
  const code = state ? stateToCode(state) : undefined;
  return code ? tokenForCode(viewUid, code) : undefined;
}

export function decodeOpenViewRouteState(viewUid: string, token: unknown) {
  if (!isOpenViewRouteStateToken(token)) {
    return undefined;
  }

  for (let code = 1; code < 16; code++) {
    if (tokenForCode(viewUid, code) === token) {
      return codeToState(code);
    }
  }

  return undefined;
}
