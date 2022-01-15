import lodash from 'lodash';
type StrategyValue = false | '*' | string | string[];

export interface AclStrategyOptions {
  displayName: string;
  actions: StrategyValue;
  resource: StrategyValue;
}

export function strategyValueMatched(strategy: StrategyValue, value: string) {
  if (strategy === '*') {
    return true;
  }

  if (lodash.isString(strategy) && strategy === value) {
    return true;
  }

  if (lodash.isArray(strategy) && strategy.includes(value)) {
    return true;
  }

  return false;
}

export class AclStrategy {
  options: AclStrategyOptions;
  allowAll: boolean;
  denyAll: boolean;
  constructor(options: AclStrategyOptions) {
    this.options = options;
  }

  matchResource(resourceName: string) {
    return strategyValueMatched(this.options.resource, resourceName);
  }

  matchAction(actionName: string) {
    return strategyValueMatched(this.options.actions, actionName);
  }

  allow(resourceName: string, actionName: string) {
    return this.matchResource(resourceName) && this.matchAction(actionName);
  }
}
