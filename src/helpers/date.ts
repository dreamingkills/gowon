import parse from "parse-duration";
import moment, { DurationInputArg2 } from "moment";

const fallbackRegex = /(\s+|\b)(s(econd)?|m(inute)?|h(our)?|d(ay)?|w(eek)?|mo(nth)?|q(uarter)?|y(ear)?)(\s|\b)/gi;

function timeFrameConverter(timeframe: string): string {
  if (timeframe.trim().length > 1) return timeframe.trim();

  switch (timeframe.trim()) {
    case "s":
      return "string";
    case "m":
      return "minute";
    case "h":
      return "hour";
    case "d":
      return "day";
    case "w":
      return "w";
    case "mo":
      return "month";
    case "q":
      return "quarter";
    case "y":
      return "year";
  }

  return "d";
}

export interface TimeRange {
  from?: Date;
  to?: Date;
}

export function generateTimeRange(string: string): TimeRange {
  let difference = parse(string, "second");

  console.log(string);

  if (!difference) {
    let matches = string.match(fallbackRegex) || [];

    if (matches.length < 1) return {};

    let match = timeFrameConverter(matches[0]);

    return {
      from: moment()
        .subtract(1, match as DurationInputArg2)
        .toDate(),
      to: new Date(),
    };
  }

  return {
    from: moment().subtract(difference, "second").toDate(),
    to: new Date(),
  };
}

export function generateHumanTimeRange(string: string): string {
  let timeRange = generateTimeRange(string);

  if (timeRange.from) {
    let durationRegex = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([a-zµμ]*)/gi;

    let matches = string.match(durationRegex) || [];

    if (matches.length < 1) {
      let matches = string.match(fallbackRegex) || [];

      if (matches.length < 1) return "overall";

      let match = timeFrameConverter(matches[0]);

      return "over the past " + match;
    } else return "over the past " + matches[0];
  } else return "overall";
}

export function generatePeriod(string: string): string {
  let periodRegexes: { [period: string]: RegExp } = {
    "7day": /(\s+|\b)(w(eek(s)?)?)(\s|\b)/gi,
    "3month": /(\s+|\b)((3|three) *mo(nth(s)?)?|q(uarter)?)(\s|\b)/gi,
    "6month": /(\s+|\b)((6|six) *mo(nth(s)?)?|h(alf(\s*year)?)?)(\s|\b)/gi,
    "12month": /(\s+|\b)((12|twelve) *mo(nth(s)?)?|y(ear)?)(\s|\b)/gi,
    "1month": /(\s+|\b)((1|one)? *mo(nth(s)?)?)(\s|\b)/gi,
  };

  for (let period of Object.keys(periodRegexes)) {
    let regex = periodRegexes[period];

    let matches = string.match(regex) || [];

    if (matches.length > 0) return period;
  }

  return "overall";
}

export function generateHumanPeriod(string: string): string {
  let period = generatePeriod(string);

  switch (period) {
    case "7day":
      return "over the past week"
    case "1month":
      return "over the past month";
    case "3month":
      return "over the past 3 months";
    case "6month":
      return "over the past 6 months";
    case "12month":
      return "over the past year";
    default:
      return "overall";
  }
}
