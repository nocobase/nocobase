import { observer } from '@formily/react';
import { Pagination as AntdPagination } from 'antd';
import React, { KeyboardEventHandler } from 'react';
import { useProps } from '../../hooks/useProps';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

export const Pagination = withDynamicSchemaProps(
  observer(
    (props: any) => {
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
