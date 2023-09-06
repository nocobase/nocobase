import cronstrue from 'cronstrue';

class CronstrueLocale {
  constructor(protected data: any) {}
  atX0SecondsPastTheMinuteGt20(): string | null {
    return this.data['atX0SecondsPastTheMinuteGt20'];
  }
  atX0MinutesPastTheHourGt20(): string | null {
    return this.data['atX0MinutesPastTheHourGt20'];
  }
  commaMonthX0ThroughMonthX1(): string | null {
    return this.data['commaMonthX0ThroughMonthX1'];
  }
  commaYearX0ThroughYearX1(): string | null {
    return this.data['commaYearX0ThroughYearX1'];
  }
  use24HourTimeFormatByDefault() {
    return this.data['use24HourTimeFormatByDefault'];
  }
  anErrorOccuredWhenGeneratingTheExpressionD() {
    return this.data['anErrorOccuredWhenGeneratingTheExpressionD'];
  }
  everyMinute() {
    return this.data['everyMinute'];
  }
  everyHour() {
    return this.data['everyHour'];
  }
  atSpace() {
    return this.data['atSpace'];
  }
  everyMinuteBetweenX0AndX1() {
    return this.data['everyMinuteBetweenX0AndX1'];
  }
  at() {
    return this.data['at'];
  }
  spaceAnd() {
    return this.data['spaceAnd'];
  }
  everySecond() {
    return this.data['everySecond'];
  }
  everyX0Seconds() {
    return this.data['everyX0Seconds'];
  }
  secondsX0ThroughX1PastTheMinute() {
    return this.data['secondsX0ThroughX1PastTheMinute'];
  }
  atX0SecondsPastTheMinute() {
    return this.data['atX0SecondsPastTheMinute'];
  }
  everyX0Minutes() {
    return this.data['everyX0Minutes'];
  }
  minutesX0ThroughX1PastTheHour() {
    return this.data['minutesX0ThroughX1PastTheHour'];
  }
  atX0MinutesPastTheHour() {
    return this.data['atX0MinutesPastTheHour'];
  }
  everyX0Hours() {
    return this.data['everyX0Hours'];
  }
  betweenX0AndX1() {
    return this.data['betweenX0AndX1'];
  }
  atX0() {
    return this.data['atX0'];
  }
  commaEveryDay() {
    return this.data['commaEveryDay'];
  }
  commaEveryX0DaysOfTheWeek() {
    return this.data['commaEveryX0DaysOfTheWeek'];
  }
  commaX0ThroughX1() {
    return this.data['commaX0ThroughX1'];
  }
  commaAndX0ThroughX1() {
    return this.data['commaAndX0ThroughX1'];
  }
  first() {
    return this.data['first'];
  }
  second() {
    return this.data['second'];
  }
  third() {
    return this.data['third'];
  }
  fourth() {
    return this.data['fourth'];
  }
  fifth() {
    return this.data['fifth'];
  }
  commaOnThe() {
    return this.data['commaOnThe'];
  }
  spaceX0OfTheMonth() {
    return this.data['spaceX0OfTheMonth'];
  }
  lastDay() {
    return this.data['lastDay'];
  }
  commaOnTheLastX0OfTheMonth() {
    return this.data['commaOnTheLastX0OfTheMonth'];
  }
  commaOnlyOnX0() {
    return this.data['commaOnlyOnX0'];
  }
  commaAndOnX0() {
    return this.data['commaAndOnX0'];
  }
  commaEveryX0Months() {
    return this.data['commaEveryX0Months'];
  }
  commaOnlyInX0() {
    return this.data['commaOnlyInX0'];
  }
  commaOnTheLastDayOfTheMonth() {
    return this.data['commaOnTheLastDayOfTheMonth'];
  }
  commaOnTheLastWeekdayOfTheMonth() {
    return this.data['commaOnTheLastWeekdayOfTheMonth'];
  }
  commaDaysBeforeTheLastDayOfTheMonth() {
    return this.data['commaDaysBeforeTheLastDayOfTheMonth'];
  }
  firstWeekday() {
    return this.data['firstWeekday'];
  }
  weekdayNearestDayX0() {
    return this.data['weekdayNearestDayX0'];
  }
  commaOnTheX0OfTheMonth() {
    return this.data['commaOnTheX0OfTheMonth'];
  }
  commaEveryX0Days() {
    return this.data['commaEveryX0Days'];
  }
  commaBetweenDayX0AndX1OfTheMonth() {
    return this.data['commaBetweenDayX0AndX1OfTheMonth'];
  }
  commaOnDayX0OfTheMonth() {
    return this.data['commaOnDayX0OfTheMonth'];
  }
  commaEveryHour() {
    return this.data['commaEveryHour'];
  }
  commaEveryX0Years() {
    return this.data['commaEveryX0Years'];
  }
  commaStartingX0() {
    return this.data['commaStartingX0'];
  }
  daysOfTheWeek() {
    return this.data['daysOfTheWeek'];
  }
  monthsOfTheYear() {
    return this.data['monthsOfTheYear'];
  }
}

export const loadConstrueLocale = (data) => {
  // vite bug: https://github.com/vitejs/vite/issues/2139
  const cronstrueVal = (cronstrue as any).default ? (cronstrue as any).default : cronstrue;
  cronstrueVal.initialize({
    load(availableLocales) {
      availableLocales[data?.lang] = new CronstrueLocale(data?.cronstrue);
    },
  });
};
