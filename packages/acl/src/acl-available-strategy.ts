import lodash from 'lodash';
type StrategyValue = false | '*' | string | string[];

export interface AvailableStrategyOptions {
  displayName?: string;
  actions: false | string | string[];
  resource?: '*';
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

export class ACLAvailableStrategy {
  options: AvailableStrategyOptions;

  constructor(options: AvailableStrategyOptions) {
    this.options = options;
  }

  matchAction(actionName: string) {
    return strategyValueMatched(this.options.actions, actionName);
  }

  allow(resourceName: string, actionName: string) {
    return this.matchAction(actionName);
  }
}
