/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Environment } from '../environment';

describe('Environment', () => {
  let env: Environment;

  beforeEach(() => {
    env = new Environment();
  });

  describe('getVariables', () => {
    it('should return all variables including secrets', () => {
      env.setVariable('API_URL', 'https://example.com', { isSecret: false });
      env.setVariable('DB_PASSWORD', 's3cret', { isSecret: true });

      const vars = env.getVariables();
      expect(vars).toEqual({ API_URL: 'https://example.com', DB_PASSWORD: 's3cret' });
    });
  });

  describe('getNonSecretVariables', () => {
    it('should return only non-secret variables', () => {
      env.setVariable('API_URL', 'https://example.com', { isSecret: false });
      env.setVariable('APP_NAME', 'test', { isSecret: false });

      const vars = env.getNonSecretVariables();
      expect(vars).toEqual({ API_URL: 'https://example.com', APP_NAME: 'test' });
    });

    it('should exclude secret variables', () => {
      env.setVariable('API_URL', 'https://example.com', { isSecret: false });
      env.setVariable('DB_PASSWORD', 's3cret', { isSecret: true });

      const vars = env.getNonSecretVariables();
      expect(vars).toEqual({ API_URL: 'https://example.com' });
      expect(vars).not.toHaveProperty('DB_PASSWORD');
    });
  });

  describe('getVariablesAndSecrets', () => {
    it('should return all variables including secrets', () => {
      env.setVariable('API_URL', 'https://example.com', { isSecret: false });
      env.setVariable('DB_PASSWORD', 's3cret', { isSecret: true });

      const vars = env.getVariablesAndSecrets();
      expect(vars).toEqual({ API_URL: 'https://example.com', DB_PASSWORD: 's3cret' });
    });
  });

  describe('setVariable without isSecret option', () => {
    it('should preserve existing secret status when options are omitted', () => {
      env.setVariable('DB_PASSWORD', 's3cret', { isSecret: true });
      expect(env.getNonSecretVariables()).not.toHaveProperty('DB_PASSWORD');

      env.setVariable('DB_PASSWORD', 'new_secret');
      expect(env.getNonSecretVariables()).not.toHaveProperty('DB_PASSWORD');
      expect(env.getVariablesAndSecrets()).toHaveProperty('DB_PASSWORD', 'new_secret');
    });

    it('should preserve non-secret status when options are omitted', () => {
      env.setVariable('API_URL', 'https://example.com', { isSecret: false });
      expect(env.getNonSecretVariables()).toHaveProperty('API_URL');

      env.setVariable('API_URL', 'https://new.com');
      expect(env.getNonSecretVariables()).toHaveProperty('API_URL', 'https://new.com');
    });
  });

  describe('removeVariable', () => {
    it('should remove variable and its secret status', () => {
      env.setVariable('DB_PASSWORD', 's3cret', { isSecret: true });
      env.removeVariable('DB_PASSWORD');

      expect(env.getNonSecretVariables()).not.toHaveProperty('DB_PASSWORD');
      expect(env.getVariablesAndSecrets()).not.toHaveProperty('DB_PASSWORD');
    });
  });

  describe('renderJsonTemplate', () => {
    it('should resolve all variables including secrets in templates', () => {
      env.setVariable('API_URL', 'https://example.com', { isSecret: false });
      env.setVariable('DB_PASSWORD', 's3cret', { isSecret: true });

      const result = env.renderJsonTemplate({
        url: '{{$env.API_URL}}',
        password: '{{$env.DB_PASSWORD}}',
      });
      expect(result).toEqual({ url: 'https://example.com', password: 's3cret' });
    });
  });
});
