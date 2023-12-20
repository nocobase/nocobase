import { type UserConfig } from 'vitest/config';
export declare const defineConfig: (
  config?: UserConfig & {
    server: boolean;
  },
) => UserConfig;
