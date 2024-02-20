import evaluators from '..';

const mathEval = evaluators.get('math.js');
const formulaEval = evaluators.get('formula.js');

describe('evaluate', () => {
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

  it('number path to array item 1 (math.js)', () => {
    const result = mathEval('{{a}}[1]', { a: [1, 2, 3] });
    expect(result).toBe(1);
  });

  // NOTE: This case is skipped because `a.<number>` is not able to be configured from UI.
  it.skip('number path to array item 0 (math.js)', () => {
    expect(() => mathEval('{{a.0}}', { a: [1, 2, 3] })).toThrow();
  });

  it.skip('number path to array item 1 (math.js)', () => {
    const result = mathEval('{{a.1}}', { a: [1, 2, 3] });
    expect(result).toBe(1);
  });

  it('number path to object member 0 (math.js)', () => {
    const result = mathEval('{{a.1}}', { a: { 1: 1 } });
    expect(result).toBe(1);
  });

  it('number lead string path to object member (formula.js)', () => {
    const result = formulaEval('{{a.1a}}', { a: { '1a': 1 } });
    expect(result).toBe(1);
  });
});
