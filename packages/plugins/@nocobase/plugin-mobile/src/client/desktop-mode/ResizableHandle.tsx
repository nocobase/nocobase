/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

export const BottomRightHandle = () => (
  <div
    style={{
      cursor: 'nwse-resize',
      userSelect: 'none',
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 17,
      height: 17,
      position: 'relative',
      top: 5,
      left: 10,
      zIndex: 1,
    }}
  >
    <svg
      style={{ transform: 'translateX(-0.125rem) translateY(-0.125rem) rotate(-45deg)' }}
      viewBox="0 0 16 6"
      width="16"
      height="6"
      fill="none"
      stroke="currentColor"
    >
      <path d="M 0 0.5 H 16 M 0 5.5 H 16"></path>
    </svg>
  </div>
);
export const BottomLeftHandle = () => (
  <div
    style={{
      cursor: 'nwse-resize',
      userSelect: 'none',
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 17,
      height: 17,
      position: 'relative',
      top: 5,
      left: -7,
      zIndex: 1,
    }}
  >
    <svg
      style={{ transform: 'translateX(0.125rem) translateY(-0.125rem) rotate(45deg)' }}
      viewBox="0 0 16 6"
      width="16"
      height="6"
      fill="none"
      stroke="currentColor"
    >
      <path d="M 0 0.5 H 16 M 0 5.5 H 16"></path>
    </svg>
  </div>
);
export const LeftRightHandle = ({ left = 0 }) => (
  <div
    style={{
      cursor: 'ew-resize',
      userSelect: 'none',
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: 17,
      left,
      position: 'relative',
      zIndex: 1,
    }}
  >
    <svg viewBox="0 0 6 16" width="6" height="16" fill="none" stroke="currentColor">
      <path d="M 0.5 0 V 16 M 5.5 0 V 16"></path>
    </svg>
  </div>
);
export const BottomHandle = () => (
  <div
    style={{
      cursor: 'ns-resize',
      userSelect: 'none',
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 17,
      width: '100%',
      position: 'relative',
      zIndex: 1,
    }}
  >
    <svg viewBox="0 0 16 6" width="16" height="6" fill="none" stroke="currentColor">
      <path d="M 0 0.5 H 16 M 0 5.5 H 16"></path>
    </svg>
  </div>
);
