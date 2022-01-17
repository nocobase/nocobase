import React from 'react';
import { Link, MemoryRouter } from 'react-router-dom';
import { RouteSwitchProvider, RouteSwitch, SchemaComponentProvider, compose } from '@nocobase/client';
import { Hello } from './Hello';
import { RouteSchemaComponent } from './RouteSchemaComponent';
import routes from './routes';

const providers = [
  [MemoryRouter, { initialEntries: ['/'] }],
  [SchemaComponentProvider, { components: { Hello } }],
  [RouteSwitchProvider, { components: { RouteSchemaComponent } }],
];

const App = compose(...providers)(() => {
  return (
    <div>
      <Link to={'/'}>Home</Link>,<Link to={'/about'}>About</Link>
      <RouteSwitch routes={routes} />
    </div>
  );
});

export default App;
