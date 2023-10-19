import { ToWords } from 'to-words';

function getConverter(currency: string) {
  if (
    !getConverter['converter'] ||
    (currency && getConverter['currency'] != currency) ||
    (getConverter['currency'] && getConverter['currency'] != currency)
  ) {
    const converter = new ToWords({
      ...(currency && { localeCode: currency }),
    });
    getConverter['converter'] = converter;
    if (currency) getConverter['currency'] = currency;
  }
  return getConverter['converter'];
}

export function toDbType(value: any, type: string, currency: string, ignoreDecimal: boolean, doNotAddOnly: boolean) {
  const converter = getConverter(currency);
  const result = converter.convert(value, {
    currency: currency ? true : false,
    ignoreZeroCurrency: true,
    ignoreDecimal,
    doNotAddOnly,
  });
  // console.log('*********************************************');
  // console.log(result);
  // console.log('*********************************************');
  return result;
}
