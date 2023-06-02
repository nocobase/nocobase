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

  it('function result number', () => {
    const result = formulaEval('{{a}}', {
      a() {
        return 1;
      },
    });
    expect(result).toBe(1);
  });

  it('function result Date', () => {
    const result = formulaEval('{{a}}', {
      a() {
        return new Date();
      },
    });
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z/);
  });

  it('number path to array item 0 (math.js)', () => {
    expect(() => mathEval('{{a.0}}', { a: [1, 2, 3] })).toThrow();
  });

  it('number path to array item 1 (math.js)', () => {
    const result = mathEval('{{a}}[1]', { a: [1, 2, 3] });
    expect(result).toBe(1);
  });

  it('number path to array item 1 (math.js)', () => {
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
