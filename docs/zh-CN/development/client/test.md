# 测试

测试基于 [Jest](https://jestjs.io/) 测试框架。同时还包括了常用的 React 测试库，如 [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)

## 示例

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