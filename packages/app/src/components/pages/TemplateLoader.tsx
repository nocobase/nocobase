import React from 'react';
import { Redirect } from 'umi';
import get from 'lodash/get';
import { Spin } from '@/components/spin';
// import { CollectionLoader } from './CollectionLoader';

function getRoutes(path: string, pages: any) {
  const keys = path.split('/');
  const routes: Array<any> = [];
  while (keys.length) {
    const uri = keys.join('/');
    if (pages[uri]) {
      routes.push({ ...pages[uri], path: uri });
    }
    keys.pop();
  }
  if (path && pages['/']) {
    routes.push({ ...pages['/'], path: '/' });
  }
  return routes;
}

export function TemplateLoader(props: any) {
  const { loading, pathname, pages, templates } = props;
  if (loading) {
    return <Spin size={'large'} className={'spinning--absolute'}></Spin>;
  }
  const redirect = get(pages, [pathname, 'redirect']);
  if (redirect) {
    return <Redirect to={redirect} />;
  }
  const routes = getRoutes(pathname, pages);
  let component: any;
  console.log(templates);
  const len = routes.length;
  const componentProps = { ...props };
  while (routes.length) {
    const route = routes.shift();
    console.log(route.template);
    // const tmp = route.template.replace(/^@\/pages\//g, '');
    let Component: any;
    // const Component = route.type === 'collection'
    //   ? CollectionLoader
    //   : require(`@/pages/${tmp}`).default;
    if (route.type === 'collection') {
      Component = (props) => {
        return <div {...props}></div>
      };
      componentProps.match.params['collection'] = route.collection;
    } else {
      Component = templates[route.template];
    }
    if (len === routes.length + 1) {
      componentProps.match.params['pagepath'] = route.path.replace(/^\//g, '');
      componentProps['lastPage'] = route;
    }
    componentProps['page'] = route;
    component = (
      <Component key={`page-${route.id}`} {...componentProps}>
        {component}
      </Component>
    );
    if (route.inherit === false) {
      break;
    }
  }
  return component;
}

export default TemplateLoader;
