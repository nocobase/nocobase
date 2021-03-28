import match from 'mime-match';

export default function (file, options: string | string[] = '*', ctx): boolean {
  return options.toString().split(',').some(match(file.mimetype));
}
