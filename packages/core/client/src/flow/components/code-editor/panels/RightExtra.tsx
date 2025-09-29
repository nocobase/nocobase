/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { EditorRef } from '../types';
import { Flex } from 'antd';

export const RightExtra: React.FC<{
  rightExtra?: ((editorRef: EditorRef, setActive: (key: string, active: boolean) => void) => React.ReactNode)[];
  extraEditorRef: EditorRef;
  onActionCountChange?: (count: number) => void;
  extraContent?: React.ReactNode;
}> = ({ rightExtra, extraEditorRef, onActionCountChange, extraContent }) => {
  const [activeCount, setActiveCount] = useState<{ [key: string]: boolean }>({});
  const setActive = (key: string, active: boolean) => {
    setActiveCount((prev) => {
      const next = { ...prev, [key]: active };
      const count = Object.values(next).filter(Boolean).length;
      onActionCountChange?.(count);
      return next;
    });
  };

  const baseStyle: React.CSSProperties = { padding: '8px', borderBottom: '1px solid #d9d9d9' };
  const { visible } = useMemo(() => {
    const hasActive = Object.values(activeCount).some(Boolean);
    const hasRight = Array.isArray(rightExtra) && rightExtra.length > 0;
    const hasExtra = !!extraContent;
    return { visible: hasActive || hasRight || hasExtra };
  }, [activeCount, rightExtra, extraContent]);

  useEffect(() => {
    // Avoid side-effect during render; update ref after render pass
    extraEditorRef.buttonGroupHeight = visible ? 50 : 0;
  }, [visible, extraEditorRef]);

  if (!visible) return null;
  return (
    <Flex gap="middle" justify="flex-end" align="center" style={baseStyle}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {extraContent}
        {rightExtra?.map((fn) => fn(extraEditorRef, setActive))}
      </div>
    </Flex>
  );
};
