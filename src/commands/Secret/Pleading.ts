import { BaseCommand } from "../../lib/command/BaseCommand";
import { Message } from "discord.js";

export default class Pleading extends BaseCommand {
  aliases = ["🥺"];
  description = ":pleading:";
  secretCommand = true;

  async run(message: Message) {
    await message.channel.send(`​  🥺\n👉👈`);
  }
}
