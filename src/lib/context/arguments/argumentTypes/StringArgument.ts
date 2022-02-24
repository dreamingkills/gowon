import { Message } from "discord.js";
import escapeStringRegexp from "escape-string-regexp";
import { GowonContext } from "../../Context";
import {
  BaseArgument,
  ContentBasedArgumentOptions,
  defaultContentBasedOptions,
  defaultIndexableOptions,
  SliceableArgumentOptions,
} from "./BaseArgument";

export interface StringArgumentOptions
  extends SliceableArgumentOptions,
    ContentBasedArgumentOptions {
  splitOn: string | RegExp;
  match: string[];
  regex: RegExp;
}

export class StringArgument extends BaseArgument<
  string,
  StringArgumentOptions
> {
  constructor(options: Partial<StringArgumentOptions> = {}) {
    super(
      defaultIndexableOptions,
      defaultContentBasedOptions,
      { splitOn: /\s+/, match: [] },
      options
    );
  }

  parseFromMessage(_: Message, content: string, ctx: GowonContext): string {
    const cleanContent = this.cleanContent(ctx, content);

    if (this.options.match.length) {
      const regex = new RegExp(
        `(?:\\b|$)${this.options.match
          .map((m) => escapeStringRegexp(m))
          .join("|")}(?:\\b|^)`,
        "gi"
      );

      return this.parseFromRegex(content, regex);
    } else if (this.options.regex) {
      return this.parseFromRegex(content, this.options.regex);
    } else {
      const splitContent = cleanContent.split(this.options.splitOn);

      return this.getElementFromIndex(splitContent, this.options.index, {
        join: true,
      });
    }
  }

  parseFromInteraction() {
    return "";
  }

  private parseFromRegex(content: string, regex: RegExp): string {
    const matches = Array.from(content.matchAll(regex) || []);

    const match = this.getElementFromIndex(matches, this.options.index);

    if (match && typeof match[0] === "string") {
      return match[0];
    } else return "";
  }
}
