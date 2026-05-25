/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const markerSvg = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="63" viewBox="0 0 38 63"><path fill="${color}" d="M19 0C8.5 0 0 8.5 0 19c0 14.2 19 44 19 44s19-29.8 19-44C38 8.5 29.5 0 19 0Z"/><circle fill="white" cx="19" cy="19" r="8"/></svg>`,
  )}`;

export const selectedImage = markerSvg(mapSelectedColor);
export const defaultImage = markerSvg(mapActiveColor);
import { mapActiveColor, mapSelectedColor } from './theme';
