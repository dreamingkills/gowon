import { Message, MessageEmbed } from "discord.js";
import { numberDisplay } from "../../../helpers";
import { ListCommand } from "./ListCommand";

export default class ArtistList extends ListCommand {
  aliases = ["alist", "topartists", "topartist", "artists"];
  description = "Shows your top artists";

  async run(message: Message) {
    let { username } = await this.parseMentionedUsername(message);

    let topArtists = await this.lastFMService.topArtists({
      username,
      limit: this.listAmount,
      period: this.timePeriod,
    });

    let messageEmbed = new MessageEmbed()
      .setTitle(
        `Top ${numberDisplay(this.listAmount, "artist")} for \`${username}\` ${
          this.humanReadableTimePeriod
        }`
      )
      .setDescription(
        topArtists.artist
          .map(
            (a) => `${numberDisplay(a.playcount, "play")} - ${a.name.bold()}`
          )
          .join("\n")
      );

    await message.channel.send(messageEmbed);
  }
}