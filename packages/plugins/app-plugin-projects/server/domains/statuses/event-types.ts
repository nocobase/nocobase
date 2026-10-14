/**
 * Status events other plugins contribute (`projectsStatusEventsToken`): a key such as `acme.merged`, the statuses an
 * issue may be in when it happens (`from`) and the status it then moves to (`to`). This plugin never knows what an
 * event means; its plugin fires it for the issues it concerns (`Projects.statusEvents.fire`), and each issue in one of
 * the `from` statuses moves to `to` as the system.
 *
 * A type is looked up on each use, so a plugin may add it after this plugin's services are created.
 */
import {
  isFixedStatus,
  STATUS_EVENT_PATTERN,
} from '../../../shared/statuses.js';

export interface StatusEventType {
  /** Dotted, the plugin's prefix first, such as `acme.merged`. */
  readonly key: string;
  /** The statuses the event moves an issue out of. */
  readonly from: readonly string[];
  /** The status it moves the issue to. */
  readonly to: string;
}

export interface StatusEventTypes {
  /** Adds an event; returns what removes it. Throws when the key is taken or malformed, or a status is unknown. */
  add(type: StatusEventType): () => void;
  get(key: string): StatusEventType | undefined;
  list(): readonly StatusEventType[];
}

export function createStatusEventTypes(): StatusEventTypes {
  const types = new Map<string, StatusEventType>();
  return {
    add(type) {
      if (!STATUS_EVENT_PATTERN.test(type.key))
        throw new TypeError(
          `Status event ${type.key} must match ${String(STATUS_EVENT_PATTERN)}.`,
        );
      if (types.has(type.key))
        throw new TypeError(`Status event ${type.key} is registered already.`);
      for (const key of [...type.from, type.to])
        if (!isFixedStatus(key))
          throw new TypeError(
            `Status event ${type.key} names the unknown status ${key}.`,
          );
      types.set(type.key, type);
      return () => {
        if (types.get(type.key) === type) types.delete(type.key);
      };
    },
    get: (key) => types.get(key),
    list: () => [...types.values()],
  };
}
