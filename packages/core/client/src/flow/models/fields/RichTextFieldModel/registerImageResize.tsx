/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ImageResize from 'quill-image-resize-module-react';

export const registerImageResize = (Quill) => {
  // 扩展 Image format 以支持 width 和 height 属性
  const Image = Quill.import('formats/image');

  class ImageFormat extends Image {
    static formats(domNode) {
      const formats = super.formats(domNode);
      if (domNode.hasAttribute('width')) {
        formats.width = domNode.getAttribute('width');
      }
      if (domNode.hasAttribute('height')) {
        formats.height = domNode.getAttribute('height');
      }
      // 支持 style 中的 width 和 height
      if (domNode.style.width) {
        formats.width = domNode.style.width;
      }
      if (domNode.style.height) {
        formats.height = domNode.style.height;
      }
      return formats;
    }

    format(name, value) {
      if (name === 'width' || name === 'height') {
        if (value) {
          this.domNode.setAttribute(name, value);
          // 同时设置到 style 中，确保显示正确
          this.domNode.style[name] = value;
        } else {
          this.domNode.removeAttribute(name);
          this.domNode.style[name] = '';
        }
      } else {
        super.format(name, value);
      }
    }

    // 重写 value 方法，清理 imageResize 添加的 cursor 样式
    value() {
      // 移除 cursor 样式
      if (this.domNode.style.cursor) {
        this.domNode.style.cursor = '';
      }
      return super.value();
    }
  }

  Quill.register(ImageFormat, true);
  Quill.register('modules/imageResize', ImageResize);
};
