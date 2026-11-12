import { readFileSync } from 'node:fs';
import { OfficeParser } from 'officeparser';
import { expect, it } from 'vitest';

it('reads PDF text through officeparser and its local PDF.js worker', async () => {
  const bytes = readFileSync(new URL('./fixtures/sample.pdf', import.meta.url));
  const ast = await OfficeParser.parseOffice(bytes, {
    ocr: false,
    extractAttachments: false,
    outputErrorToConsole: false,
  });
  expect(ast.toText().toLowerCase()).toContain('quokka pdf marker');
  expect(ast.content.length).toBeGreaterThan(0);
});
