import React from 'react';

export class TaskResultRendererManager {
  private renderers = new Map<string, React.ComponentType<any>>();

  register(type: string, renderer: React.ComponentType<any>) {
    this.renderers.set(type, renderer);
  }

  get(type: string) {
    return this.renderers.get(type);
  }
}
