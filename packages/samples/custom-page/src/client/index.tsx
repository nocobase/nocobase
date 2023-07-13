import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloWorld = () => {
  return <div>Hello ui router</div>;
};

class CustomPlugin extends Plugin {
  async load() {
    this.addRoutes();
  }

  addRoutes() {
    this.app.router.add('hello', {
      path: '/hello',
      element: <HelloWorld />,
    });
  }
}

export default CustomPlugin;
