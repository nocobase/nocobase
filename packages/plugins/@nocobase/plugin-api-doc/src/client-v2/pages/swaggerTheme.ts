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
 * 把 Swagger UI 的自带皮肤压到当前主题上。
 *
 * Swagger UI 自己带一整套 CSS（字体、圆角、阴影、蓝绿配色），和设置中心那套黑白灰放在
 * 一起像两个网站。这里不改它的 DOM，只按 token 覆盖表层样式：
 *
 * - 排版和控件跟随主题，圆角 / 边框 / 输入框和别的页面一致；
 * - 请求方法的颜色**保留**——GET / POST / DELETE 靠颜色区分是功能信号，全部灰掉之后
 *   只能逐字读；但整行的彩色底去掉，颜色只留在方法那个小标签上，噪音降下来；
 * - 它自带的大标题块隐藏——页面顶部已经有「API 文档」了，重复一次只是占地方。
 *
 * @param {GlobalToken} token 当前主题 token
 * @returns {string} 作用域样式文本
 */
export function buildSwaggerCss(token: GlobalToken): string {
  // 方法色写死，不取主题的语义色：简约主题把 colorInfo 钉成了黑色、colorSuccess 是
  // antd 那个高饱和绿，套上去 GET 变纯黑、POST 刺眼。这里用一组压过饱和度的固定色，
  // 彼此仍然分得开，也不会把页面拉回彩色。
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

/* 页面顶部已经有标题了，Swagger 自己那块 info 是第二遍。 */
.nb-swagger .swagger-ui .information-container {
  display: none;
}

/* servers + Authorize 那条：去掉它自带的灰底和阴影，融进页面。 */
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

/* 整行彩色底换成白底，方法本身的颜色只留在那个小标签上。 */
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
