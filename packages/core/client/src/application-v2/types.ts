import type { i18n as i18next } from 'i18next';
import type { ComponentType } from 'react';
import type { BrowserRouterProps, HashRouterProps, MemoryRouterProps, RouteObject } from 'react-router-dom';
import type { Plugin } from './Plugin';

export interface BrowserRouterOptions extends Omit<BrowserRouterProps, 'children'> {
  type?: 'browser';
}
export interface HashRouterOptions extends Omit<HashRouterProps, 'children'> {
  type?: 'hash';
}
export interface MemoryRouterOptions extends Omit<MemoryRouterProps, 'children'> {
  type?: 'memory';
}
export type RouterOptions = HashRouterOptions | BrowserRouterOptions | MemoryRouterOptions;

export type ComponentTypeAndString<T = any> = ComponentType<T> | string;

export interface RouteType extends Omit<RouteObject, 'children' | 'Component'> {
  Component?: ComponentTypeAndString;
}

export type ComponentAndProps<T = any> = [ComponentType, T];

export type PluginType<Opts = any> = typeof Plugin | [typeof Plugin, Opts];

export interface ApplicationOptions {
  apiClient?: any;
  i18n?: i18next;
  providers?: (ComponentType | [ComponentType, any])[];
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
}
