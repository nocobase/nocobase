import { render, screen } from '@nocobase/test/client';
import React from 'react';
import { describe } from 'vitest';
import { compose, normalizeContainer } from '../utils';

describe('utils', () => {
  describe('normalizeContainer', () => {
    let originalConsoleWarn: any;
    beforeEach(() => {
      originalConsoleWarn = console.warn;
    });
    afterEach(() => {
      console.warn = originalConsoleWarn;
    });

    it('when container is undefined or null, return null', () => {
      const fn = vitest.fn();
      console.warn = fn;
      expect(normalizeContainer(undefined)).toBeNull();
      expect(fn).toBeCalledTimes(1);
    });

    it('when container is string and can not find element, return null', () => {
      const fn = vitest.fn();
      console.warn = fn;
      expect(normalizeContainer('#app')).toBeNull();
      expect(fn).toBeCalledTimes(1);
    });
    it('when container is string and can find element, return element', () => {
      render(<div id="app">App</div>);
      expect(normalizeContainer('#app')).toBeInTheDocument();
    });
    it('when container is element, return element', () => {
      render(<div id="app">App</div>);
      const element = document.getElementById('#app');
      expect(normalizeContainer(element)).toBe(element);
    });
  });

  describe('compose', () => {
    const Hello = ({ children }: any) => <div>Hello {children}</div>;
    const World = ({ name, children }: any) => (
      <div>
        <div>World</div>
        <div>{name}</div>
        <div>{children}</div>
      </div>
    );
    const Foo = () => <div>Foo</div>;

    it('compose without LastComponent', () => {
      const composeFn = compose([Hello, undefined], [World, { name: 'aaa' }]);
      const Compose = composeFn();
      render(<Compose />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('aaa')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('compose with LastComponent', () => {
      const composeFn = compose([Hello, undefined]);
      const Compose = composeFn(Foo);
      render(<Compose />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Foo')).toBeInTheDocument();
    });
  });
});
