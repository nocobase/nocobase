import { useField } from '@formily/react';
import { PageHeader as AntdPageHeader } from 'antd';
import React, { useEffect } from 'react';
import { useDocumentTitle } from '../../../document-title';
import { useCompile } from '../../hooks';

export const Page = (props) => {
  const { children, ...others } = props;
  const field = useField();
  const compile = useCompile();
  const { title, setTitle } = useDocumentTitle();
  useEffect(() => {
    if (!title) {
      setTitle(field.title);
    }
  }, [field.title, title]);
  return (
    <>
      <AntdPageHeader ghost={false} title={compile(title)} {...others} />
      <div style={{ margin: 24 }}>{children}</div>
    </>
  );
};
