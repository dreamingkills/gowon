import { BaseCommand } from "../../lib/command/BaseCommand";
import { AdminService } from "../../services/dbservices/AdminService";
import { displayNumber } from "../../lib/views/displays";
import { ServiceRegistry } from "../../services/ServicesRegistry";
import { StringArgument } from "../../lib/context/arguments/argumentTypes/StringArgument";
import { bold, code } from "../../helpers/discord";

const args = {
  keywords: new StringArgument({
    required: { customMessage: "Please enter some keywords!" },
    description: "The keywords to search with",
  }),
} as const;

export default class SearchCommands extends BaseCommand<typeof args> {
  idSeed = "exid solji";

  aliases = ["command", "commandsearch", "searchcommand", "sc"];
  subcategory = "about";
  description = "Search the list of commands";

  usage = "keywords";
  slashCommand = true;

  arguments = args;

  adminService = ServiceRegistry.get(AdminService);

  customContext = {
    constants: { adminService: this.adminService },
  };

  async run() {
    const keywords = this.parsedArguments
      .keywords!.toLowerCase()
      .replace(/\s+/, "");

    const commandList = this.commandRegistry.deepList();

    const commands = await this.adminService.can.viewList(
      this.ctx,
      commandList
    );

    const foundCommands = this.commandRegistry.search(commands, keywords);

    const embed = this.newEmbed()
      .setTitle(`Command search results for ${code(keywords)}`)
      .setDescription(
        foundCommands
          .map((c) => this.displayCommand(c, keywords))
          .slice(0, 12)
          .sort()
          .join("\n")
      )
      .setFooter({
        text:
          `Searched ${displayNumber(
            commandList.length,
            "command"
          )}, found ${displayNumber(foundCommands.length, "result")}` +
          (foundCommands.length > 12
            ? "\nTry narrowing down your search to see more results, or go to https://gowon.ca/commands"
            : ""),
      });

    await this.send(embed);
  }

  private displayCommand(command: BaseCommand, keywords: string) {
    const name = command.friendlyName.replace(keywords, (match) => bold(match));

    return (command.parentName ? command.parentName + " " : "") + name;
  }
}
