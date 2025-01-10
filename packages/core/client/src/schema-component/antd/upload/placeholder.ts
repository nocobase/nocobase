/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const publicPath = window['__nocobase_dev_public_path__'] || window['__nocobase_public_path__'] || '/';

export const UPLOAD_PLACEHOLDER = [
  {
    ext: /\.docx?$/i,
    icon: '/file-placeholder/docx-200-200.png',
  },
  {
    ext: /\.pptx?$/i,
    icon: '/file-placeholder/pptx-200-200.png',
  },
  {
    ext: /\.jpe?g$/i,
    icon: '/file-placeholder/jpeg-200-200.png',
  },
  {
    ext: /\.pdf$/i,
    icon: '/file-placeholder/pdf-200-200.png',
  },
  {
    ext: /\.png$/i,
    icon: '/file-placeholder/png-200-200.png',
  },
  {
    ext: /\.eps$/i,
    icon: '/file-placeholder/eps-200-200.png',
  },
  {
    ext: /\.ai$/i,
    icon: '/file-placeholder/ai-200-200.png',
  },
  {
    ext: /\.gif$/i,
    icon: '/file-placeholder/gif-200-200.png',
  },
  {
    ext: /\.svg$/i,
    icon: '/file-placeholder/svg-200-200.png',
  },
  {
    ext: /\.xlsx?$/i,
    icon: '/file-placeholder/xlsx-200-200.png',
  },
  {
    ext: /\.psd?$/i,
    icon: '/file-placeholder/psd-200-200.png',
  },
  {
    ext: /\.(wav|aif|aiff|au|mp1|mp2|mp3|ra|rm|ram|mid|rmi)$/i,
    icon: '/file-placeholder/audio-200-200.png',
  },
  {
    ext: /\.(avi|wmv|mpg|mpeg|vob|dat|3gp|mp4|mkv|rm|rmvb|mov|flv)$/i,
    icon: '/file-placeholder/video-200-200.png',
  },
  {
    ext: /\.(zip|rar|arj|z|gz|iso|jar|ace|tar|uue|dmg|pkg|lzh|cab)$/i,
    icon: '/file-placeholder/zip-200-200.png',
  },
].map((item) => {
  return {
    ext: item.ext,
    icon: publicPath + item.icon.slice(1),
  };
});

export const UNKNOWN_FILE_ICON = publicPath + 'file-placeholder/unknown-200-200.png';
