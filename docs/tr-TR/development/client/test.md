# Testing

Testing is based on the [Jest](https://jestjs.io/) testing framework. Also included are common React testing libraries such as [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)

## Example

```tsx | pure
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RouteSwitch } from '../RouteSwitch';
import { RouteSwitchProvider } from '../RouteSwitchProvider';

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
```
