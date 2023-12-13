import {
  MessageOptions as DiscordMessageOptions,
  InteractionReplyOptions,
  Message,
  MessageEmbed,
} from "discord.js";
import { SendOptions } from "../../../services/Discord/DiscordService.types";
import { UIComponent } from "./UIComponent";

export type SendableContent = string | MessageEmbed | UIComponent;

export class Sendable<T extends SendableContent = SendableContent> {
  constructor(public content: T) {}

  public asDiscordSendOptions(
    overrides: Partial<SendOptions> = {}
  ): DiscordMessageOptions & InteractionReplyOptions {
    const content = this.getContent();

    const embeds = this.getEmbeds(content, overrides);
    const files = this.getFiles(overrides);

    return {
      ...embeds,
      ...files,
      content: typeof content === "string" ? content : undefined,
      ephemeral: this.getEphemeral(overrides),
    };
  }

  public async afterSend(message: Message) {
    if (this.isUIComponent()) {
      this.content.afterSend(message);
    }
  }

  private getContent(): string | MessageEmbed {
    if (this.isUIComponent()) {
      return this.content.asMessageEmbed();
    } else return this.content as string | MessageEmbed;
  }

  private getEmbeds(
    content: string | MessageEmbed,
    overrides: Partial<SendOptions>
  ): Pick<DiscordMessageOptions, "embeds"> {
    if (typeof content === "string") {
      if (overrides.withEmbed) {
        return { embeds: [overrides.withEmbed] };
      } else return {};
    } else {
      return {
        embeds: overrides?.withEmbed
          ? [content, overrides.withEmbed]
          : [content],
      };
    }
  }

  private getFiles(
    overrides: Partial<SendOptions>
  ): Pick<DiscordMessageOptions, "files"> {
    if (this.isUIComponent()) {
      return {
        files: [...this.content.getFiles(), ...(overrides.files || [])],
      };
    } else return { files: overrides.files };
  }

  private getEphemeral(overrides: Partial<SendOptions>): boolean {
    return (
      overrides.ephemeral ??
      (this.isUIComponent() ? this.content.isEphemeral() : false)
    );
  }

  private isUIComponent(): this is Sendable<UIComponent> {
    return this.content instanceof UIComponent;
  }
}
