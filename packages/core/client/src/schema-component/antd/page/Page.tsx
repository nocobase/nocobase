import React, { useEffect } from 'react';
import { PageHeader as AntdPageHeader } from 'antd';
import { observer, useField } from '@formily/react';
import { useDocumentTitle } from '../../../document-title';

export const Page = (props) => {
  const { children, ...others } = props;
  const field = useField();
  const { title, setTitle } = useDocumentTitle();
  useEffect(() => {
    if (!title) {
      setTitle(field.title);
    }
  }, [field.title, title]);
  return (
    <>
      <AntdPageHeader ghost={false} title={title} {...others} />
      <div style={{ margin: 24 }}>{children}</div>
    </>
  );
};
