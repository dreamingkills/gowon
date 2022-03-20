import { CrownsChildCommand } from "./CrownsChildCommand";
import { ago } from "../../../helpers";
import { bold } from "../../../helpers/discord";

export class RecentlyStolen extends CrownsChildCommand {
  idSeed = "wjsn soobin";

  description = "Lists the crowns that were most recently stolen";
  aliases = ["recent", "stolen", "rs"];
  usage = "";

  slashCommand = true;

  async run() {
    let crowns = await this.crownsService.listRecentlyStolen(
      this.ctx,
      10,
      await this.serverUserIDs({ filterCrownBannedUsers: true })
    );

    let embed = this.newEmbed()
      .setTitle(`Recently stolen crowns in ${this.requiredGuild.name}`)
      .setDescription(
        crowns
          .map((c) => `${bold(c.artistName)} ― yoinked ${ago(c.lastStolen)}`)
          .join("\n")
      );

    await this.send(embed);
  }
}
