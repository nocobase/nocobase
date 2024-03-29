import { parseHTML } from '../parseHTML';

describe('parseHTML', () => {
  it('should replace variables in HTML with their corresponding values', () => {
    const html = '<h1>{{title}}</h1><p>{{content}}</p>';
    const variables = {
      title: 'Hello',
      content: 'World',
    };
    const expected = '<h1>Hello</h1><p>World</p>';

    const result = parseHTML(html, variables);

    expect(result).toEqual(expected);
  });

  it('should not replace variables that are not present in the variables object', () => {
    const html = '<h1>{{title}}</h1><p>{{content}}</p>';
    const variables = {
      title: 'Hello',
    };
    const expected = '<h1>Hello</h1><p>{{content}}</p>';

    const result = parseHTML(html, variables);

    expect(result).toEqual(expected);
  });

  it('should not replace variables that have undefined values', () => {
    const html = '<h1>{{title}}</h1><p>{{content}}</p>';
    const variables = {
      title: 'Hello',
      content: undefined,
    };
    const expected = '<h1>Hello</h1><p>{{content}}</p>';

    const result = parseHTML(html, variables);

    expect(result).toEqual(expected);
  });
});
