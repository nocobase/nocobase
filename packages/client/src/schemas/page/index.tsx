import React from 'react';
import { PageHeader as AntdPageHeader } from 'antd';
import { observer } from '@formily/react';
import { usePageTitleContext } from '../../constate/PageTitle';
import { Helmet } from 'react-helmet';
import { useCompile } from '../../hooks/useCompile';

export const Page = observer((props) => {
  const { children, ...others } = props;
  const { documentTitle, pageTitle } = usePageTitleContext();
  const compile = useCompile();
  return (
    <>
      <Helmet>
        <title>{compile(documentTitle)}</title>
      </Helmet>
      <AntdPageHeader ghost={false} title={pageTitle} {...others} />
      <div style={{ margin: 24 }}>{children}</div>
    </>
  );
});
