/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import React, { useMemo } from 'react';
import { useToken } from '../__builtins__';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6 }) => {
  const { token } = useToken();

  const headerHeight = token.controlHeight * 2.06; // 66px
  const bodyRowHeight = token.controlHeight * 1.75; // 56px

  const skeletonClass = useMemo(
    () => css`
      &.skeleton-wrapper {
        width: 100%;
        background: ${token.colorBgContainer};
        border-radius: ${token.borderRadiusLG}px;
        overflow: hidden;
      }

      .skeleton-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .skeleton-cell {
        padding: ${token.padding}px ${token.padding}px;
        border-bottom: 1px solid ${token.colorBorderSecondary};
        vertical-align: middle;
        height: ${bodyRowHeight}px;
        box-sizing: border-box;
      }

      .skeleton-cell:first-child {
        padding-left: ${token.padding + 2}px;
        width: ${token.controlHeight * 1.2}px;
      }

      .header {
        background: ${token.colorFillQuaternary};
      }

      .header .skeleton-cell {
        padding-top: ${token.padding}px;
        padding-bottom: ${token.padding}px;
        height: ${headerHeight}px;
      }

      .skeleton-loading {
        height: ${token.controlHeight / 2}px;
        background: ${token.colorFillSecondary};
        border-radius: ${token.borderRadiusSM}px;
      }

      .skeleton-checkbox {
        width: ${token.controlHeight / 2}px;
        height: ${token.controlHeight / 2}px;
        background: ${token.colorFillSecondary};
        border-radius: ${token.borderRadiusSM}px;
      }

      thead tr {
        height: ${headerHeight}px;
      }

      tbody tr {
        height: ${bodyRowHeight}px;
      }
    `,
    [
      bodyRowHeight,
      headerHeight,
      token.borderRadiusLG,
      token.borderRadiusSM,
      token.colorBgContainer,
      token.colorBorderSecondary,
      token.colorFillQuaternary,
      token.controlHeight,
      token.padding,
    ],
  );

  return (
    <div className={`skeleton-wrapper ${skeletonClass}`}>
      <table className="skeleton-table">
        <thead>
          <tr className="header">
            <th className="skeleton-cell">
              <div className="skeleton-checkbox" />
            </th>
            {Array(columns)
              .fill(null)
              .map((_, i) => (
                <th key={i} className="skeleton-cell">
                  <div className="skeleton-loading" />
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {Array(rows)
            .fill(null)
            .map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="skeleton-cell">
                  <div className="skeleton-checkbox" />
                </td>
                {Array(columns)
                  .fill(null)
                  .map((_, colIndex) => (
                    <td key={colIndex} className="skeleton-cell">
                      <div className="skeleton-loading" />
                    </td>
                  ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
