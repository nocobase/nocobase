import { Plugin } from '../Plugin';
import { useApp } from './useApp';

export function usePlugin<T extends typeof Plugin>(plugin: T): InstanceType<T>;
export function usePlugin<T extends {}>(name: string): T;
export function usePlugin(name: any) {
  const app = useApp();
  return app.pm.get(name);
}
