type Calculator = (...args: any[]) => any;

const calculators = new Map<string, Calculator>();

export function getCalculator(type: string): Calculator {
  return calculators.get(type);
}

export function registerCalculator(type: string, fn: Calculator) {
  calculators.set(type, fn);
}

export function registerCalculators(calculators) {
  Object.keys(calculators).forEach(key => {
    registerCalculator(key, calculators[key]);
  });
}

function equal(a, b) {
  return a === b;
}

function gt(a, b) {
  return a > b;
}

function gte(a, b) {
  return a >= b;
}

function lt(a, b) {
  return a < b;
}

function lte(a, b) {
  return a <= b;
}

// TODO: add more common calculators

registerCalculators({
  equal,
  gt,
  gte,
  lt,
  lte,
  '===': equal,
  '>': gt,
  '>=': gte,
  '<': lt,
  '<=': lte
});
