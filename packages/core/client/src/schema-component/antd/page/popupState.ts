/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Manages the visibility state of popups at different levels.
 * Each level represents a layer of nested popups, where level 1 is the first popup,
 * level 2 is a popup opened from within the first popup, and so on.
 */
const popupLayerStates: Record<string | number, boolean> = {};

/**
 * Sets the visibility state of a popup at the specified level
 * @param layerLevel - The level of the popup to set state for
 * @param isOpen - Whether the popup should be open (true) or closed (false)
 */
export const setPopupLayerState = (layerLevel: number, isOpen: boolean) => {
  popupLayerStates[layerLevel] = isOpen;
};

/**
 * Gets the current visibility state of a popup at the specified level
 * @param layerLevel - The level of the popup to check
 * @returns The visibility state of the popup (true if open, false if closed)
 */
export const getPopupLayerState = (layerLevel: number) => {
  return popupLayerStates[layerLevel] ?? false;
};

/**
 * Removes the visibility state for a popup at the specified level.
 * This effectively cleans up the state when a popup is fully closed.
 * @param layerLevel - The level of the popup to remove state for
 */
export const removePopupLayerState = (layerLevel: number) => {
  delete popupLayerStates[layerLevel];
};
