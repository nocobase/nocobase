/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';
import { EventContext, EventListener, EventListenerOptions, Unsubscriber } from './types';

interface RegisteredListener {
  eventName: string;
  listener: EventListener;
  options: EventListenerOptions;
}

/**
 * Default condition function for event listeners.
 */
export function defaultListenerCondition(ctx: EventContext, options: EventListenerOptions): boolean {
  // 未指定目标，默认运行
  if (!ctx.target) {
    return true;
  }

  return ctx.target?.id === options?.id;
}

export class EventBus {
  private listeners = new Map<string, RegisteredListener[]>();
  private patternListeners = new Map<string, RegisteredListener[]>();

  /**
   * Registers an event listener
   */
  on(eventName: string | string[], listener: EventListener, options: EventListenerOptions = {}): Unsubscriber {
    const finalOptions: EventListenerOptions = {
      sort: options.sort ?? 0,
      once: options.once ?? false,
      blocking: options.blocking ?? false,
      id: options.id ?? uid(),
      condition: options.condition ?? defaultListenerCondition,
    };

    if (Array.isArray(eventName)) {
      const unsubscribers = eventName.map((name) => this.addSingleListener(name, listener, finalOptions));
      return () => unsubscribers.forEach((unsub) => unsub());
    }

    return this.addSingleListener(eventName, listener, finalOptions);
  }

  /**
   * Registers a one-time event listener
   */
  once(
    eventName: string | string[],
    listener: EventListener,
    options: Omit<EventListenerOptions, 'once'> = {},
  ): Unsubscriber {
    return this.on(eventName, listener, { ...options, once: true });
  }

  /**
   * Removes an event listener or all listeners for eventName
   */
  off(eventName: string | string[], listener?: EventListener): void {
    if (Array.isArray(eventName)) {
      eventName.forEach((name) => this.singleOff(name, listener));
    } else {
      this.singleOff(eventName, listener);
    }
  }

  /**
   * Removes an event listener or all listeners for an event
   */
  private singleOff(eventName: string, listener?: EventListener): void {
    // Check if this is a wildcard pattern
    const isWildcard = eventName.includes('*');
    const listenersMap = isWildcard ? this.patternListeners : this.listeners;

    if (!listenersMap.has(eventName)) {
      return;
    }

    if (listener) {
      // Remove specific listener
      const listeners = listenersMap.get(eventName);
      const newListeners = listeners.filter((reg) => reg.listener !== listener);

      if (newListeners.length === 0) {
        listenersMap.delete(eventName);
      } else {
        listenersMap.set(eventName, newListeners);
      }
    } else {
      // Remove all listeners for this event
      listenersMap.delete(eventName);
    }
  }

  /**
   * Dispatches an event
   */
  async dispatchEvent<T = any>(eventName: string | string[], ctx: EventContext<T>): Promise<Record<string, any>> {
    // Initialize results if not present
    if (!ctx.results) {
      ctx.results = {};
    }

    // Add metadata
    if (!ctx.meta) {
      ctx.meta = {};
    }
    ctx.meta.timestamp = Date.now();
    ctx.meta.event = eventName;

    // For multiple event names, dispatch each one
    if (Array.isArray(eventName)) {
      for (const name of eventName) {
        await this.dispatchSingleEvent(name, ctx);
        // If propagation stopped, break early
        if (ctx.results._stop) {
          break;
        }
      }
      return ctx.results;
    }

    await this.dispatchSingleEvent(eventName, ctx);
    return ctx.results;
  }

  /**
   * Gets all listeners for a specific event name
   * Mainly used for testing
   */
  getListeners(eventName: string): RegisteredListener[] {
    return this.listeners.get(eventName) || [];
  }

  /**
   * Add a single listener for a specific event name
   */
  private addSingleListener(eventName: string, listener: EventListener, options: EventListenerOptions): Unsubscriber {
    const registeredListener: RegisteredListener = {
      eventName,
      listener,
      options,
    };

    // Check if this is a wildcard pattern
    const isWildcard = eventName.includes('*');
    const listenersMap = isWildcard ? this.patternListeners : this.listeners;

    if (!listenersMap.has(eventName)) {
      listenersMap.set(eventName, []);
    }

    listenersMap.get(eventName).push(registeredListener);

    // Return unsubscribe function
    return () => this.singleOff(eventName, listener);
  }

  /**
   * Helper method to find all matching listeners for an event
   */
  private findMatchingListeners(eventName: string): Set<RegisteredListener> {
    const matchingListeners = new Set<RegisteredListener>();

    // Get direct listeners for this exact event name
    const directListeners = this.listeners.get(eventName) || [];
    directListeners.forEach((reg) => matchingListeners.add(reg));

    // Get pattern listeners that match this event name
    for (const [pattern, listeners] of this.patternListeners.entries()) {
      if (this.patternMatches(pattern, eventName)) {
        listeners.forEach((reg) => matchingListeners.add(reg));
      }
    }

    // If the event name itself contains wildcards, also check for concrete listeners that match the pattern
    if (eventName.includes('*')) {
      for (const [concreteEvent, listeners] of this.listeners.entries()) {
        if (this.patternMatches(eventName, concreteEvent)) {
          listeners.forEach((reg) => matchingListeners.add(reg));
        }
      }
    }

    return matchingListeners;
  }

  /**
   * Dispatch a single event
   */
  private async dispatchSingleEvent(eventName: string, ctx: EventContext): Promise<void> {
    // Find all matching listeners
    const matchingListeners = this.findMatchingListeners(eventName);

    // Sort all applicable listeners by sort
    const allListeners = Array.from(matchingListeners).sort((a, b) => b.options.sort - a.options.sort);

    // Execute each listener
    for (const { listener, options, eventName: registeredEventName } of allListeners) {
      // Check if propagation was stopped
      if (ctx.results._stop) {
        break;
      }

      // Apply condition function to determine if listener should execute
      if (options.condition && !options.condition(ctx, options)) {
        continue;
      }

      try {
        // Execute the listener
        const result = listener(ctx);

        // Handle async listeners
        if (result instanceof Promise && options.blocking) {
          await result;
        }

        // Remove one-time listeners
        if (options.once) {
          this.off(registeredEventName, listener);
        }
      } catch (error) {
        // Initialize errors array if needed
        if (!ctx.results._errors) {
          ctx.results._errors = [];
        }
        // Add context to the error
        const contextualizedError = new Error(`Event listener error for '${eventName}': ${error.message}`);
        (contextualizedError as any).originalError = error;
        (contextualizedError as any).eventName = eventName;

        console.error(contextualizedError);

        // For blocking listeners, stop and reject
        if (options.blocking) {
          ctx.results._stop = true;
          throw contextualizedError;
        } else {
          // For non-blocking, just collect the error and continue
          (ctx.results._errors as any[]).push(contextualizedError);
        }
      }
    }
  }

  /**
   * Checks if a wildcard pattern matches an event name
   * @param pattern The pattern to check (can contain wildcards)
   * @param eventName The event name to match against
   */
  private patternMatches(pattern: string, eventName: string): boolean {
    // * matches exactly one segment
    const segments = pattern.split(':');
    const eventSegments = eventName.split(':');

    // Quick length check
    if (segments.length !== eventSegments.length) {
      return false;
    }

    // Check each segment
    for (let i = 0; i < segments.length; i++) {
      if (segments[i] !== '*' && segments[i] !== eventSegments[i]) {
        return false;
      }
    }

    return true;
  }
}
