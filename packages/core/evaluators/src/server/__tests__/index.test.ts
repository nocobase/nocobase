import { evaluate } from '../../utils';
import evaluators from '..';

describe('evaluate', () => {
  describe('pre-process', () => {
    const preProcess = evaluate.bind((expression, scope) => ({ expression, scope }), {});
    const preProcessReplaceValue = evaluate.bind((expression, scope) => ({ expression, scope }), {
      replaceValue: true,
    });

    it('only variable as null', () => {
      const { expression, scope } = preProcess('{{a}}', { a: null });
      expect(expression).toBe(`$$0`);
      expect(scope.$$0).toBeNull();
    });

    it('string containing variable', () => {
      const { expression, scope } = preProcess('a{{a}}b', { a: 1 });
      expect(expression).toBe(`a$$0b`);
      expect(scope.$$0).toBe(1);
    });

    it('duplicated variable name in expression should be unique in new scope', () => {
      const { expression, scope } = preProcess('{{a}} {{a}}', { a: 1 });
      expect(expression).toBe(`$$0 $$0`);
      expect(Object.keys(scope).length).toBe(1);
      expect(scope.$$0).toBe(1);
    });

    it('number path to array item 0', () => {
      const { expression, scope } = preProcess('{{a.0}}', { a: [1, 2, 3] });
      expect(expression).toBe(`$$0`);
      expect(scope.$$0).toBe(1);
    });

    it('number path to array item 1', () => {
      const { expression, scope } = preProcess('{{a.1}}', { a: [1, 2, 3] });
      expect(expression).toBe(`$$0`);
      expect(scope.$$0).toBe(2);
    });

    it('deep array path', () => {
      const { expression, scope } = preProcess('{{a.b}}', { a: [{ b: 1 }, { b: 2 }] });
      expect(expression).toBe(`$$0`);
      expect(scope.$$0).toEqual([1, 2]);
    });

    it('pre-process replace value', () => {
      const { expression, scope } = preProcessReplaceValue('a{{a}}b', { a: 1 });
      expect(expression).toBe(`a1b`);
      expect(scope.$$0).toBe(1);
    });
  });

  describe('math.js', () => {
    const mathEval = evaluators.get('math.js');

    it('number path to array item 0 (math.js)', () => {
      expect(() => mathEval('{{a}}[0]', { a: [1, 2, 3] })).toThrow();
    });

    it('number path to array item 1 (math.js)', () => {
      const result = mathEval('{{a}}[1]', { a: [1, 2, 3] });
      expect(result).toBe(1);
    });

    it('number path to array item 0 (math.js)', () => {
      const result = mathEval('{{a.0}}', { a: [1, 2, 3] });
      expect(result).toBe(1);
    });

    it('number path to object member 0 (math.js)', () => {
      const result = mathEval('{{a.1}}', { a: { 1: 1 } });
      expect(result).toBe(1);
    });

    it('string expression with space', () => {
      const result = mathEval('{{a}}  + 1', { a: 1 });
      expect(result).toBe(2);
    });
  });

  describe('formula.js', () => {
    const formulaEval = evaluators.get('formula.js');

    it('reference null or undefined', () => {
      const result = formulaEval('{{a.b}}', { a: null });
      expect(result).toBeNull();
    });

    it('function result string with quote', () => {
      const result = formulaEval('{{a}}', {
        a() {
          return "I'm done.";
        },
      });
      expect(result).toBe("I'm done.");
    });

    it('function result null', () => {
      const result = formulaEval('{{a}}', {
        a() {
          return null;
        },
      });
      expect(result).toBe(null);
    });

    it('function result number', () => {
      const result = formulaEval('{{a}}', {
        a() {
          return 1;
        },
      });
      expect(result).toBe(1);
    });

    it('function result Date', () => {
      const now = new Date();
      const result = formulaEval('{{a}}', {
        a() {
          return now;
        },
      });
      expect(result).toBeInstanceOf(Date);
      expect(result).toBe(now);
    });

    it('deep array', () => {
      const result = formulaEval('{{a.b}}', { a: [{ b: 1 }, { b: 2 }] });
      expect(result).toEqual([1, 2]);
    });

    it('key with dash', () => {
      const result = formulaEval('{{a-b}}', { 'a-b': 1 });
      expect(result).toBe(1);
    });

    it('deep key with dash', () => {
      const result = formulaEval('{{a.b-c}}', { a: { 'b-c': 1 } });
      expect(result).toBe(1);
    });

    it('number lead string path to object member (formula.js)', () => {
      const result = formulaEval('{{a.1a}}', { a: { '1a': 1 } });
      expect(result).toBe(1);
    });
  });

  describe('string', () => {
    const stringReplace = evaluators.get('string');

    it('only variable', () => {
      const result = stringReplace('{{a}}', { a: 1 });
      expect(result).toBe('1');
    });

    it('string containing undefined variable', () => {
      const result = stringReplace('a{{a}}b', {});
      expect(result).toBe('ab');
    });

    it('string containing null variable', () => {
      const result = stringReplace('a{{a}}b', { a: null });
      expect(result).toBe('ab');
    });

    it('string containing boolean variable', () => {
      const result = stringReplace('a{{a}}b', { a: false });
      expect(result).toBe('afalseb');
    });

    it('string containing number variable', () => {
      const result = stringReplace('a{{a}}b', { a: 1 });
      expect(result).toBe('a1b');
    });

    it('string containing NaN variable', () => {
      const result = stringReplace('a{{a}}b', { a: Number.NaN });
      expect(result).toBe('ab');
    });

    it('string containing infinite variable', () => {
      const result = stringReplace('a{{a}}b', { a: Number.POSITIVE_INFINITY });
      expect(result).toBe('ab');
    });

    it('string containing function variable', () => {
      const result = stringReplace('a{{a}}b', {
        a() {
          return 1;
        },
      });
      expect(result).toBe('a1b');
    });
  });
});
