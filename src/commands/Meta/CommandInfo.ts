import { CommandNotFoundError } from "../../errors";
import { Arguments } from "../../lib/arguments/arguments";
import { CommandManager } from "../../lib/command/CommandManager";
import { Validation } from "../../lib/validation/ValidationChecker";
import { validators } from "../../lib/validation/validators";
import { displayNumber } from "../../lib/views/displays";
import { MetaBaseCommand } from "./MetaBaseCommand";

const args = {
  inputs: {
    searchString: {
      index: { start: 0 },
    },
  },
} as const;

export default class CommandInfo extends MetaBaseCommand<typeof args> {
  idSeed = "iz*one hyewon";

  arguments: Arguments = args;

  validation: Validation = {
    searchString: {
      validator: new validators.Required({}),
      friendlyName: "search string",
    },
  };

  devCommand = true;
  description = "Displays some info about a command";

  commandManager = new CommandManager();

  async run() {
    let searchString = this.parsedArguments.searchString!;

    await this.commandManager.init();

    const { command, runAs } = await this.commandManager.find(
      searchString,
      this.guild.id
    );

    if (!command) throw new CommandNotFoundError();

    const count = await this.metaService.countCommandRuns(command.id);

    let embed = this.newEmbed().setTitle(
      `Info about ${runAs.toCommandFriendlyName()}`
    ).setDescription(`
      **Name**: ${command.name}${
      command.parentName ? `\n**Parent**: ${command.parentName}` : ""
    }
      **Id**: ${command.idSeed} — ${command.id.italic()}${
      command.hasChildren
        ? `\n**Number of children**: ${command.children?.list().length || 0}`
        : ""
    }
    **Category**: ${command.category || "(no category)"}${
      command.subcategory ? ` > ${command.subcategory}` : ""
    }
    
    Run ${displayNumber(count, "time")}
      
    `);

    await this.send(embed);
  }
}
