const methods = [
  'atX0SecondsPastTheMinuteGt20',
  'atX0MinutesPastTheHourGt20',
  'commaMonthX0ThroughMonthX1',
  'commaYearX0ThroughYearX1',
  'use24HourTimeFormatByDefault',
  'anErrorOccuredWhenGeneratingTheExpressionD',
  'everyMinute',
  'everyHour',
  'atSpace',
  'everyMinuteBetweenX0AndX1',
  'at',
  'spaceAnd',
  'everySecond',
  'everyX0Seconds',
  'secondsX0ThroughX1PastTheMinute',
  'atX0SecondsPastTheMinute',
  'everyX0Minutes',
  'minutesX0ThroughX1PastTheHour',
  'atX0MinutesPastTheHour',
  'everyX0Hours',
  'betweenX0AndX1',
  'atX0',
  'commaEveryDay',
  'commaEveryX0DaysOfTheWeek',
  'commaX0ThroughX1',
  'commaAndX0ThroughX1',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'commaOnThe',
  'spaceX0OfTheMonth',
  'lastDay',
  'commaOnTheLastX0OfTheMonth',
  'commaOnlyOnX0',
  'commaAndOnX0',
  'commaEveryX0Months',
  'commaOnlyInX0',
  'commaOnTheLastDayOfTheMonth',
  'commaOnTheLastWeekdayOfTheMonth',
  'commaDaysBeforeTheLastDayOfTheMonth',
  'firstWeekday',
  'weekdayNearestDayX0',
  'commaOnTheX0OfTheMonth',
  'commaEveryX0Days',
  'commaBetweenDayX0AndX1OfTheMonth',
  'commaOnDayX0OfTheMonth',
  'commaEveryHour',
  'commaEveryX0Years',
  'commaStartingX0',
  'daysOfTheWeek',
  'monthsOfTheYear',
];

const langs = {
  af: 'af',
  ar: 'ar',
  be: 'be',
  ca: 'ca',
  cs: 'cs',
  da: 'da',
  de: 'de',
  'en-US': 'en',
  es: 'es',
  fa: 'fa',
  fi: 'fi',
  fr: 'fr',
  he: 'he',
  hu: 'hu',
  id: 'id',
  it: 'it',
  'ja-JP': 'ja',
  ko: 'ko',
  nb: 'nb',
  nl: 'nl',
  pl: 'pl',
  pt_BR: 'pt_BR',
  pt_PT: 'pt_PT',
  ro: 'ro',
  'ru-RU': 'ru',
  sk: 'sk',
  sl: 'sl',
  sv: 'sv',
  sw: 'sw',
  'th-TH': 'th',
  'tr-TR': 'tr',
  uk: 'uk',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
};

export const getCronstrueLocale = (lang) => {
  const lng = langs[lang] || 'en';
  const Locale = require(`cronstrue/locales/${lng}`);
  let locale;
  if (Locale?.default) {
    locale = Locale.default.locales[lng];
  } else {
    const L = Locale[lng];
    locale = new L();
  }
  const items = {};
  for (const method of methods) {
    try {
      items[method] = locale[method]();
    } catch (error) {
      // empty
    }
  }
  return items;
};
