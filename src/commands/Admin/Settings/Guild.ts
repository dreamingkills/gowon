import config from "../../../../config.json";
import { bold } from "../../../helpers/discord";
import { SettingsChildCommand } from "./SettingsChildCommand";

export class Guild extends SettingsChildCommand {
  idSeed = "kep1er dayeon";

  description = "Links you to the guild settings for the current guild";
  usage = [""];

  aliases = ["server", "guildsettings", "serversettings"];

  slashCommand = true;
  adminCommand = true;
  guildRequired = true;

  async run() {
    const embed = this.authorEmbed()
      .setHeader("Guild settings")
      .setDescription(
        `The guild settings for ${bold(
          this.requiredGuild.name
        )} can be found at:\n${
          config.gowonWebsiteURL +
          `/dashboard/settings/guild/${this.requiredGuild.id}`
        }`
      );

    await this.send(embed);
  }
}
