import { render } from '@testing-library/react';
import React from 'react';
import { compose } from '../compose';

describe('compose', () => {
  it('case 1', () => {
    const A: React.FC = (props) => (
      <div>
        <h1>A</h1>
        {props.children}
      </div>
    );
    const App = compose(A)();
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });

  it('case 2', () => {
    const A: React.FC = (props) => (
      <div>
        <h1>A</h1>
        {props.children}
      </div>
    );
    const B: React.FC = (props) => (
      <div>
        <h1>B</h1>
        {props.children}
      </div>
    );
    const App = compose(A)(B);
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });

  it('case 3', () => {
    const A: React.FC = (props) => (
      <div>
        <h1>A</h1>
        {props.children}
      </div>
    );
    const App = compose([A])();
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });

  it('case 4', () => {
    const A: React.FC = (props) => (
      <div>
        <h1>A</h1>
        {props.children}
      </div>
    );
    const B: React.FC = (props) => (
      <div>
        <h1>B</h1>
        {props.children}
      </div>
    );
    const C: React.FC = (props) => (
      <div>
        <h1>C</h1>
        {props.children}
      </div>
    );
    const App = compose(A, B)(C);
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });

  it('case 5', () => {
    const A: React.FC<any> = (props) => (
      <div>
        <h1>A {props.name}</h1>
        {props.children}
      </div>
    );
    const B: React.FC<any> = (props) => (
      <div>
        <h1>B {props.name}</h1>
        {props.children}
      </div>
    );
    const C: React.FC<any> = (props) => (
      <div>
        <h1>C</h1>
        {props.children}
      </div>
    );
    const App = compose(A, [B, { name: '1' }])(C);
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
