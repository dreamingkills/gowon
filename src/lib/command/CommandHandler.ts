import { CommandManager } from "./CommandManager";
import { Message } from "discord.js";
import { GowonService } from "../../services/GowonService";
import { AdminService } from "../../services/dbservices/AdminService";
import { Logger } from "../Logger";
import { CheckFailReason } from "../permissions/Can";
import { ParentCommand } from "./ParentCommand";
import { MetaService } from "../../services/dbservices/MetaService";

export class CommandHandler {
  gowonService = GowonService.getInstance();
  adminService = new AdminService();
  metaService = new MetaService();
  commandManager = new CommandManager();
  private logger = new Logger();

  constructor() {}

  async init() {
    await this.commandManager.init();
  }

  async handle(message: Message): Promise<void> {
    if (
      !message.content.toLowerCase().includes("not good bot") &&
      (message.content.toLowerCase().includes("good bot") ||
        message.content.toLowerCase().includes("thank you bot") ||
        message.content.toLowerCase().includes("thanks bot") ||
        message.content.toLowerCase().includes("not bad bot"))
    ) {
      message.react("🥰");
    } else if (
      message.content.toLowerCase().includes("stupid bot") ||
      message.content.toLowerCase().includes("fuck you bot") ||
      message.content.toLowerCase().includes("not good bot")
    ) {
      message.react("😔");
    }

    if (
      !message.author.bot &&
      message.guild &&
      message.content.match(
        new RegExp(`^${this.gowonService.regexSafePrefix}[^\\s]+`, "i")
      )
    ) {
      let { command, runAs } = this.commandManager.find(message.content);

      if (command instanceof ParentCommand)
        command = (command.default && command.default()) || command;

      let canCheck = await this.adminService.can.run(command, message);

      if (!canCheck.passed) {
        Logger.log(
          "CommandHandler",
          canCheck.reason === CheckFailReason.disabled
            ? `Attempt to run disabled command ${command.name}`
            : `User ${message.author.username} did not have permissions to run command ${command.name} (${command.id})`
        );

        return;
      }
      this.logger.logCommandHandle(runAs);

      this.metaService.recordCommandRun(command.id, message);

      await command.execute(message, runAs);
    }
  }
}
