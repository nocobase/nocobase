import string from '../../utils/string';

export default {
  label: `{{t('String template')}}`,
  tooltip: `{{t('Simple string replacement, can be used to interpolate variables in a string.')}}`,
  evaluate: string,
};
