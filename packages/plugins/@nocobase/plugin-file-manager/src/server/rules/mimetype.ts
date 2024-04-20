import match from 'mime-match';

export default function (file, options: string | string[] = '*'): boolean {
  const pattern = options.toString().trim();
  if (!pattern || pattern === '*') {
    return true;
  }
  return pattern.split(',').some(match(file.mimetype));
}
