import { BaseCommand } from "../../lib/command/BaseCommand";
import { Message } from "discord.js";

export default class Ping extends BaseCommand {
  aliases = ["🏓"];
  description = "Ping! Pong!";
  secretCommand = true;

  async run(message: Message) {
    await message.reply("Pong 🏓");
  }
}