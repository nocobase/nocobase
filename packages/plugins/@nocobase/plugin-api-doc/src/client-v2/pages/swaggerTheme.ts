/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GlobalToken } from 'antd';

/**
 * Map Swagger UI's built-in skin onto the current theme.
 *
 * Swagger UI ships a full stylesheet of its own (typography, radii, shadows, a
 * blue-and-green palette) that reads like a second website next to the neutral
 * settings center. This leaves its DOM alone and only overrides the surface:
 *
 * - typography and controls follow the theme, so radii, borders and inputs match
 *   the rest of the pages;
 * - method colors are **kept** — GET / POST / DELETE are told apart by color, and
 *   greying them out would force reading every verb; only the tinted row
 *   backgrounds go away, leaving the color on the method badge;
 * - its own title block is hidden, since the page header already says
 *   "API documentation".
 *
 * @param {GlobalToken} token current theme token
 * @returns {string} scoped stylesheet
 */
export function buildSwaggerCss(token: GlobalToken): string {
  // Fixed palette instead of semantic tokens: the minimal theme pins colorInfo to
  // black and colorSuccess is antd's saturated green, which turns GET into a solid
  // black block and makes POST shout. These hues stay distinguishable without
  // dragging color back into the page.
  const methodColors: Record<string, string> = {
    get: '#3b73c4',
    post: '#3f9070',
    put: '#b5822e',
    patch: '#b5822e',
    delete: '#bf4d45',
    head: token.colorTextTertiary,
    options: token.colorTextTertiary,
  };

  const methodRules = Object.entries(methodColors)
    .map(
      ([method, color]) => `
.nb-swagger .swagger-ui .opblock.opblock-${method} .opblock-summary-method {
  background: ${color};
}`,
    )
    .join('\n');

  return `
.nb-swagger .swagger-ui,
.nb-swagger .swagger-ui .info,
.nb-swagger .swagger-ui .opblock-tag,
.nb-swagger .swagger-ui .opblock .opblock-summary-description,
.nb-swagger .swagger-ui .btn,
.nb-swagger .swagger-ui select,
.nb-swagger .swagger-ui label,
.nb-swagger .swagger-ui table thead tr th {
  color: ${token.colorText};
  font-family: inherit;
}

.nb-swagger .swagger-ui .wrapper {
  max-width: none;
  padding: 0;
}

/* The page header already carries the title, so Swagger's info block is a repeat. */
.nb-swagger .swagger-ui .information-container {
  display: none;
}

/* The servers + Authorize bar: drop its grey background and shadow so it blends in. */
.nb-swagger .swagger-ui .scheme-container {
  background: transparent;
  box-shadow: none;
  margin: 0;
  padding: 0 0 ${token.paddingLG}px;
}

.nb-swagger .swagger-ui .opblock-tag {
  border-bottom: ${token.lineWidth}px solid ${token.colorSplit};
  font-size: ${token.fontSizeLG}px;
  font-weight: 600;
  margin-bottom: ${token.marginXS}px;
}
.nb-swagger .swagger-ui .opblock-tag small {
  color: ${token.colorTextDescription};
  font-size: ${token.fontSizeSM}px;
}

/* Plain background for the whole row; the method keeps its color on the badge. */
.nb-swagger .swagger-ui .opblock {
  background: ${token.colorBgContainer};
  border: ${token.lineWidth}px solid ${token.colorBorderSecondary};
  border-radius: ${token.borderRadiusLG}px;
  box-shadow: none;
  margin-bottom: ${token.marginXS}px;
}
.nb-swagger .swagger-ui .opblock .opblock-summary {
  border-color: ${token.colorBorderSecondary};
}
.nb-swagger .swagger-ui .opblock .opblock-summary-method {
  border-radius: ${token.borderRadiusSM}px;
  box-shadow: none;
  font-family: inherit;
  font-size: ${token.fontSizeSM}px;
  font-weight: 600;
  min-width: 72px;
  text-shadow: none;
}
${methodRules}

.nb-swagger .swagger-ui .opblock-body,
.nb-swagger .swagger-ui .opblock-section-header {
  background: ${token.colorBgContainer};
  box-shadow: none;
}
.nb-swagger .swagger-ui .opblock-section-header {
  border-top: ${token.lineWidth}px solid ${token.colorBorderSecondary};
}

.nb-swagger .swagger-ui .btn {
  border-radius: ${token.borderRadius}px;
  box-shadow: none;
  font-weight: 400;
}
.nb-swagger .swagger-ui .btn.authorize {
  background: ${token.colorBgContainer};
  border-color: ${token.colorBorder};
  color: ${token.colorText};
}
.nb-swagger .swagger-ui .btn.authorize svg {
  fill: ${token.colorText};
}
.nb-swagger .swagger-ui .btn.execute {
  background: ${token.colorPrimary};
  border-color: ${token.colorPrimary};
  color: ${token.colorTextLightSolid};
}

.nb-swagger .swagger-ui input[type='text'],
.nb-swagger .swagger-ui input[type='password'],
.nb-swagger .swagger-ui input[type='search'],
.nb-swagger .swagger-ui input[type='email'],
.nb-swagger .swagger-ui textarea,
.nb-swagger .swagger-ui select {
  border: ${token.lineWidth}px solid ${token.colorBorder};
  border-radius: ${token.borderRadius}px;
  box-shadow: none;
}

.nb-swagger .swagger-ui a,
.nb-swagger .swagger-ui .opblock-summary-path a {
  color: ${token.colorLink};
}

.nb-swagger .swagger-ui section.models {
  border: ${token.lineWidth}px solid ${token.colorBorderSecondary};
  border-radius: ${token.borderRadiusLG}px;
}
.nb-swagger .swagger-ui section.models .model-container {
  background: ${token.colorFillQuaternary};
  border-radius: ${token.borderRadius}px;
}
`;
}
