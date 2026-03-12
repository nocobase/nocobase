/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  getUploadFieldPreviewIndex,
  normalizeUploadFieldFileList,
  shouldShowUploadActionSlot,
} from '../uploadFieldUtils';

describe('shouldShowUploadActionSlot', () => {
  it('单值字段已有文件时应隐藏追加入口', () => {
    expect(shouldShowUploadActionSlot(false, 1)).toBe(false);
  });

  it('单值字段无文件时应显示追加入口', () => {
    expect(shouldShowUploadActionSlot(false, 0)).toBe(true);
  });

  it('多值字段已有文件时仍应显示追加入口', () => {
    expect(shouldShowUploadActionSlot(true, 1)).toBe(true);
  });
});

describe('normalizeUploadFieldFileList', () => {
  it('外部值回灌时应复用上一轮 uid，避免同一张图片重挂载', () => {
    const previousFileList = [
      {
        uid: 'rc-upload-1',
        filename: 'cover.png',
        response: {
          id: 1,
          url: '/files/cover.png',
          filename: 'cover.png',
        },
      },
    ];

    const nextFileList = normalizeUploadFieldFileList(
      [
        {
          id: 1,
          url: '/files/cover.png',
          filename: 'cover.png',
        },
      ],
      previousFileList,
    );

    expect(nextFileList[0].uid).toBe('rc-upload-1');
  });

  it('缺少上一轮列表时应基于记录标识生成稳定 uid', () => {
    const firstFileList = normalizeUploadFieldFileList([
      {
        id: 2,
        url: '/files/avatar.png',
        filename: 'avatar.png',
      },
    ]);
    const secondFileList = normalizeUploadFieldFileList([
      {
        id: 2,
        url: '/files/avatar.png',
        filename: 'avatar.png',
      },
    ]);

    expect(firstFileList[0].uid).toBe('id:2');
    expect(secondFileList[0].uid).toBe('id:2');
  });

  it('应保留上传组件已有的 thumbUrl，避免上传中缩略图被清空', () => {
    const fileList = normalizeUploadFieldFileList([
      {
        id: 3,
        url: '/files/thumb.png',
        filename: 'thumb.png',
        thumbUrl: 'data:image/png;base64,thumb',
      },
    ]);

    expect(fileList[0].thumbUrl).toBe('data:image/png;base64,thumb');
  });

  it('应支持 id 为 0 的文件生成稳定标识', () => {
    const fileList = normalizeUploadFieldFileList([
      {
        id: 0,
        filename: 'zero.png',
      },
    ]);

    expect(fileList[0].uid).toBe('id:0');
  });
});

describe('getUploadFieldPreviewIndex', () => {
  it('应按 uid 查找非数字 uid 的预览索引', () => {
    const fileList = [
      { uid: 'id:1', filename: 'first.png' },
      { uid: 'id:2', filename: 'second.png' },
    ];

    expect(getUploadFieldPreviewIndex(fileList, { uid: 'id:2' })).toBe(1);
  });
});
