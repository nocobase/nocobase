import { copyFile, mkdir } from 'node:fs/promises';

const targetDirectory = new URL('../dist/templates/', import.meta.url);
await mkdir(targetDirectory, { recursive: true });
await copyFile(
  new URL('../templates/invoice.docx', import.meta.url),
  new URL('invoice.docx', targetDirectory),
);
