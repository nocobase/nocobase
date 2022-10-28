import { RouteSwitchContext } from '@nocobase/client';
import React, { useContext } from 'react';

const HelloWorld = () => {
  return <div>Hello ui router</div>;
};

export default React.memo((props) => {
  const ctx = useContext(RouteSwitchContext);
  ctx.routes.push({
    type: 'route',
    path: '/hello-world',
    component: HelloWorld,
  });
  return <RouteSwitchContext.Provider value={ctx}>{props.children}</RouteSwitchContext.Provider>;
});
