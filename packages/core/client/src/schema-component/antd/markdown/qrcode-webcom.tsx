/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { QRCode, type QRCodeProps } from 'antd';
import { createRoot } from 'react-dom/client';
// ReactDOM.render(
//   <QRCodeCanvas value="https://reactjs.org/" />,
//   document.getElementById('mountNode')
// );

class QRCodeWebComponent extends HTMLElement {
  root: any;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.root = null;
  }

  getProps(attributes, propTypes = {}) {
    return [...attributes]
      .filter((attr) => attr.name !== 'style')
      .map((attr) => this.convert(propTypes, attr.name, attr.value))
      .reduce((props, prop) => ({ ...props, [prop.name]: prop.value }), {});
  }
  convert(propTypes, attrName, attrValue) {
    const propName = Object.keys(propTypes).find((key) => key.toLowerCase() == attrName);
    let value = attrValue;
    if (attrValue === 'true' || attrValue === 'false') value = attrValue == 'true';
    else if (!isNaN(attrValue) && attrValue !== '') value = +attrValue;
    else if (/^{.*}/.exec(attrValue)) value = JSON.parse(attrValue);
    return {
      name: propName ? propName : attrName,
      value: value,
    };
  }
  connectedCallback() {
    const props = {
      ...this.getProps(this.attributes),
    } as QRCodeProps;
    this.root = createRoot(this.shadowRoot as ShadowRoot);
    this.root.render(<QRCode {...props} />);
  }
  disconnectedCallback() {
    this.root.unmount();
  }
}

export function registerQrcodeWebComponent() {
  if (!customElements.get('qr-code')) {
    customElements.define('qr-code', QRCodeWebComponent);
  }
}
