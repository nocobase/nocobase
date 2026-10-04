import type { SimpleIcon } from 'simple-icons';
import type { SVGProps, ReactElement } from 'react';

export interface SimpleIconProps extends SVGProps<SVGSVGElement> {
  readonly icon: SimpleIcon;
}

export function SimpleIconGlyph({
  icon,
  ...props
}: SimpleIconProps): ReactElement {
  return (
    <svg
      aria-hidden='true'
      fill='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d={icon.path} />
    </svg>
  );
}
