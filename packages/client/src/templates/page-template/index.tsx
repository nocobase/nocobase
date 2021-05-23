import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { usePage, BlockContext } from '../../';

export function PageTemplate({ route }) {
  const { GridBlock } = useContext<any>(BlockContext);
  const [preName, setPreName] = useState(route.name);
  useEffect(() => {
    setPreName(route.name);
  }, [route.name]);
  const { data = {}, loading } = usePage(route.name);
  if (loading || preName !== route.name) {
    return <Spin />;
  }
  console.log(data.title, { preName, blocks: data.blocks });
  return (
    <div>
      <Helmet>
        <title>{data.title}</title>
      </Helmet>
      {GridBlock && <GridBlock blocks={data.blocks} />}
    </div>
  );
}

export default PageTemplate;
