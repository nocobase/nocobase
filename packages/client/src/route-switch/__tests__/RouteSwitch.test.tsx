import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RouteSwitchProvider, RouteSwitch } from '../';
import { render } from '@testing-library/react';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

describe('route-switch', () => {
  it('case 1', () => {
    const App = () => {
      return (
        <RouteSwitchProvider components={{ Home, About }}>
          <MemoryRouter initialEntries={['/']}>
            <RouteSwitch
              routes={[
                {
                  type: 'route',
                  path: '/',
                  exact: true,
                  component: 'Home',
                },
              ]}
            />
          </MemoryRouter>
        </RouteSwitchProvider>
      );
    };
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
