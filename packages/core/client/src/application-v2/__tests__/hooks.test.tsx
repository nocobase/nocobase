import React from 'react';
import { render, sleep } from 'testUtils';
import { describe } from 'vitest';
import { Application } from '../Application';
import { useApp, useRouter } from '../hooks';

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
});
