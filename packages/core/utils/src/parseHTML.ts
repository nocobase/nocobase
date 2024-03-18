/**
 * parseHTML('<span>{{version}}</span>', { version: '1.0.0' }) -> '<span>1.0.0</span>'
 * @param html
 * @param variables
 * @returns
 */
export function parseHTML(html: string, variables: Record<string, any>) {
  return html.replace(/\{\{(\w+)\}\}/g, function (match, key) {
    return typeof variables[key] !== 'undefined' ? variables[key] : match;
  });
}
