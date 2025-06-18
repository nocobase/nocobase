import { sanitizeHTMLString, parseHTMLToText } from '../sanitize';

describe('sanitizeHTMLString', () => {
  it('removes script tags and event attributes', () => {
    const html = '<img src="x" onerror="alert(1)"/><script>alert(2)</script><div>ok</div>';
    const result = sanitizeHTMLString(html);
    expect(result).toBe('<img src="x"><div>ok</div>');
  });
});

describe('parseHTMLToText', () => {
  it('parses html to plain text without scripts', () => {
    const html = '<div>Hello<script>alert(1)</script>World</div>';
    const result = parseHTMLToText(html);
    expect(result).toBe('HelloWorld');
  });
});
