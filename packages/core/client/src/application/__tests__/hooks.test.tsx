import { render, sleep, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { describe } from 'vitest';
import { Application } from '../Application';
import { Plugin } from '../Plugin';
import { useApp, usePlugin, useRouter, useAppSpin } from '../hooks';

describe('Application Hooks', () => {
  describe('useApp()', () => {
    it('should return the application instance', async () => {
      const app = new Application();
      const Hello = () => {
        const app1 = useApp();
        expect(app).toBe(app1);
        return null;
      };
      app.addProviders([Hello]);
      const Root = app.getRootComponent();
      render(<Root />);

      await sleep(10);
    });
  });

  describe('useRouter()', () => {
    it('should return the router instance', async () => {
      const app = new Application();
      const Hello = () => {
        const router = useRouter();
        expect(app.router).toBe(router);
        return null;
      };
      app.addProviders([Hello]);
      const Root = app.getRootComponent();
      render(<Root />);

      await sleep(10);
    });
  });

  describe('usePlugin()', () => {
    it('should return the plugin instance', async () => {
      class DemoPlugin extends Plugin {
        test = 'test';
      }
      const Hello = () => {
        const demo = usePlugin<{ test: string }>('demo');
        const demo2 = usePlugin(DemoPlugin);
        expect(demo).toBeInstanceOf(DemoPlugin);
        expect(demo2).toBeInstanceOf(DemoPlugin);
        expect(demo.test).toBe('test');
        expect(demo2.test).toBe('test');
        return null;
      };
      const app = new Application({ plugins: [[DemoPlugin, { name: 'demo' }]], providers: [Hello] });
      const Root = app.getRootComponent();
      render(<Root />);

      await sleep(10);
    });
  });

  describe('useAppSpin()', () => {
    test('no app, should render ant-design Spin', async () => {
      const Demo = () => {
        const spin = useAppSpin();
        return spin.render();
      };

      render(<Demo />);

      await waitFor(() => {
        expect(document.querySelector('.ant-spin')).toBeTruthy();
      });
    });

    test('has app, should render AppSpin Component', () => {
      const Demo = () => {
        const spin = useAppSpin();
        return spin.render();
      };

      const app = new Application({
        providers: [Demo],
        components: {
          AppSpin: () => <div data-testid="content">test</div>,
        },
      });
      const Root = app.getRootComponent();
      render(<Root></Root>);
      expect(document.querySelector('.ant-spin')).toBeFalsy();
      expect(screen.getByTestId('content')).toBeTruthy();
    });
  });
});
