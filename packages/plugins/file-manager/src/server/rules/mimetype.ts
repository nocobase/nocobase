import match from 'mime-match';

export default function (file, options: string | string[] = '*'): boolean {
  return options.toString().split(',').some(match(file.mimetype));
}
