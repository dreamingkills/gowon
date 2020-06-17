import { BaseCommand } from "../../BaseCommand";
import { Message } from "discord.js";

export default class TopArtists extends BaseCommand {
  aliases = ["🏓"];
  description = "Ping! Pong!";
  secretCommand = true;

  async run(message: Message) {
    await message.reply("Pong 🏓");
  }
}
