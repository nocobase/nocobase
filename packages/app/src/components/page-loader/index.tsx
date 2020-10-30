import React from 'react';
import { Redirect } from 'umi';
import get from 'lodash/get';
// import { Spin } from 'antd';
import Spin from '@/components/spin';

function getRoutes(path: string, pages: any) {
  const keys = path.split('/');
  const routes: Array<any> = [];
  while(keys.length) {
    const uri = keys.join('/');
    if (pages[uri]) {
      routes.push({...pages[uri], path: uri});
    }
    keys.pop();
  }
  if (path && pages['/']) {
    routes.push({...pages['/'], path: '/'});
  }
  return routes;
}

export default function PageLoader(props: any) {
  const { loading, pathname, templates, pages } = props;
  if (loading) {
    return <Spin size={'large'} className={'spinning--absolute'}></Spin>;
  }
  const redirect = get(pages, [pathname, 'redirect']);
  if (redirect) {
    return <Redirect to={redirect}/>
  }
  const routes = getRoutes(pathname, pages);
  let component: any;
  console.log(...routes);
  const len = routes.length;
  const componentProps = {...props};
  while(routes.length) {
    const route = routes.shift();
    const Component = templates[route.template]||templates.default;
    if (route.type === 'collection') {
      componentProps.match.params['collection'] = route.collection;
    }
    if (len === routes.length+1) {
      componentProps['lastPage'] = route;
    }
    componentProps['page'] = route;
    component = <Component key={`page-${route.id}`} {...componentProps}>{component}</Component>;
    if (route.inherit === false) {
      break;
    }
  }
  return component;
}
