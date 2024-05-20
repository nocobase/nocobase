/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Pagination as AntdPagination, PaginationProps as AntdPaginationProps } from 'antd';
import React, { KeyboardEventHandler } from 'react';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useProps } from '../../hooks/useProps';

export interface PaginationProps extends AntdPaginationProps {
  hidden?: boolean;
}

export const Pagination = withDynamicSchemaProps(
  observer(
    (props: PaginationProps) => {
      // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
      const { hidden, ...others } = useProps(props);

      if (hidden) {
        return null;
      }
      const onKeypress: KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      };

      return (
        <div onKeyPress={onKeypress}>
          <AntdPagination {...others} />
        </div>
      );
    },
    { displayName: 'Pagination' },
  ),
);
