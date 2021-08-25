import React from 'react';
import { PageHeader as AntdPageHeader } from 'antd';
import { observer } from '@formily/react';
import { usePageTitleContext } from '../../constate/PageTitle';
import { Helmet } from 'react-helmet';

export const Page = observer((props) => {
  const { children, ...others } = props;
  const { documentTitle, pageTitle } = usePageTitleContext();
  return (
    <>
      <Helmet>
        <title>{documentTitle}</title>
      </Helmet>
      <AntdPageHeader ghost={false} title={pageTitle} {...others} />
      <div style={{margin: 24}}>
        {children}
      </div>
    </>
  );
});
