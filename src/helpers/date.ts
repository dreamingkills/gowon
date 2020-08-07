import parse from "parse-duration";
import moment, { DurationInputArg2 } from "moment";

const fallbackRegex = /(\s+|\b)(s(econd)?|m(inute)?|h(our)?|d(ay)?|w(eek)?|mo(nth)?|q(uarter)?|y(ear)?)(\s|\b)/gi;
const overallRegex = /(\s+|\b)(a(lltime)?|o(verall)?)(\s|\b)/gi;

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
      return "week";
    case "mo":
      return "month";
    case "q":
      return "quarter";
    case "y":
      return "year";
  }

  return timeframe.trim();
}

export interface TimeRange {
  from?: Date;
  to?: Date;
}

export function generateTimeRange(
  string: string,
  options: { fallback?: string; useOverall?: boolean } = {}
): TimeRange {
  let difference = parse(string, "second");

  if (!difference) {
    let matches = string.match(fallbackRegex) || [];
    let overallMatch = string.match(overallRegex) || [];

    if (overallMatch.length && options.useOverall) return { to: new Date() };

    if (matches.length < 1)
      return options.fallback
        ? generateTimeRange(options.fallback)
        : { to: new Date() };

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

export function generateHumanTimeRange(
  string: string,
  options: {
    noOverall?: boolean;
    raw?: boolean;
    overallMessage?: string;
    fallback?: string;
  } = {
    noOverall: false,
    raw: false,
    overallMessage: "overall",
  }
): string {
  let timeRange = generateTimeRange(string);

  if (timeRange.from) {
    let durationRegex = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([a-zµμ]*)/gi;

    let matches = Array.from(string.matchAll(durationRegex)) || [];

    let match = matches.reduce((acc, val) => {
      if (val[2].trim()) acc = val[1] + " " + timeFrameConverter(val[2]);

      return acc;
    }, undefined as undefined | string);

    if (!match) {
      let matches = string.match(fallbackRegex) || [];

      if (matches.length < 1) return options.overallMessage!;

      let match = timeFrameConverter(matches[0]);

      return (options.raw ? "" : "over the past ") + match;
    } else return (options.raw ? "" : "over the past ") + match;
  } else {
    if (!options.noOverall && overallRegex.test(string))
      return options.overallMessage!;

    return options.fallback
      ? (options.raw ? "" : "over the past ") + options.fallback
      : options.noOverall
      ? ""
      : options.overallMessage!;
  }
}

export function generatePeriod(string: string, fallback = "overall"): string {
  let periodRegexes: { [period: string]: RegExp } = {
    "7day": /(\s+|\b)(1|one)? *(w(eek(s)?)?)|(7|seven) *d(ay(s)?)?(\s|\b)/gi,
    "3month": /(\s+|\b)((3|three) *m(o(nth(s)?)?)?|q(uarter)?)(\s|\b)/gi,
    "6month": /(\s+|\b)((6|six) *m(o(nth(s)?)?)?|h(alf(\s*year)?)?)(\s|\b)/gi,
    "12month": /(\s+|\b)((12|twelve) *m(o(nth(s)?)?)?|y(ear)?)(\s|\b)/gi,
    "1month": /(\s+|\b)(1|one)? *m(o(nth(s)?)?)?(\s|\b)/gi,
    overall: overallRegex,
  };

  for (let period of Object.keys(periodRegexes)) {
    let regex = periodRegexes[period];

    let matches = string.match(regex) || [];

    if (matches.length > 0) return period;
  }

  return fallback;
}

export function generateHumanPeriod(
  string: string,
  fallback = "overall"
): string {
  let period = generatePeriod(string, fallback);

  switch (period) {
    case "7day":
      return "over the past week";
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
