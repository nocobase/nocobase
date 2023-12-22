import { render, sleep } from '@nocobase/test/client';
import React from 'react';
import { describe } from 'vitest';
import { Application } from '../Application';
import { Plugin } from '../Plugin';
import { useApp, usePlugin, useRouter } from '../hooks';

describe('Application Hooks', () => {
  describe('useApp', () => {
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

  describe('useRouter', () => {
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

  describe('usePlugin', () => {
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
});
