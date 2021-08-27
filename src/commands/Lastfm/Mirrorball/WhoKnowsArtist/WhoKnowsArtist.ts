import { MirrorballError } from "../../../../errors";
import { LinkGenerator } from "../../../../helpers/lastFM";
import { Arguments } from "../../../../lib/arguments/arguments";
import { FLAGS } from "../../../../lib/arguments/flags";
import { Variation } from "../../../../lib/command/BaseCommand";
import { MirrorballBaseCommand } from "../../../../lib/indexing/MirrorballCommands";
import { LineConsolidator } from "../../../../lib/LineConsolidator";
import {
  displayLink,
  displayNumber,
  displayNumberedList,
} from "../../../../lib/views/displays";
import { CrownsService } from "../../../../services/dbservices/CrownsService";
import {
  NicknameService,
  UnknownUserDisplay,
} from "../../../../services/guilds/NicknameService";
import { WhoKnowsService } from "../../../../services/guilds/WhoKnowsService";
import {
  WhoKnowsArtistConnector,
  WhoKnowsArtistParams,
  WhoKnowsArtistResponse,
} from "./WhoKnowsArtist.connector";

const args = {
  inputs: {
    artist: { index: { start: 0 } },
  },
  flags: {
    noRedirect: FLAGS.noRedirect,
  },
} as const;

export default class WhoKnowsArtist extends MirrorballBaseCommand<
  WhoKnowsArtistResponse,
  WhoKnowsArtistParams,
  typeof args
> {
  connector = new WhoKnowsArtistConnector();

  idSeed = "bvndit songhee";

  aliases = ["wk", "fmwk"];

  variations: Variation[] = [{ name: "update", variation: "uwk" }];

  description = "See who knows an artist";

  subcategory = "whoknows";

  arguments: Arguments = args;

  nicknameService = new NicknameService(this.logger);
  crownsService = new CrownsService(this.logger);
  whoKnowsService = new WhoKnowsService(this.logger);

  async run() {
    const { senderRequestable, senderUser } = await this.parseMentions({
      senderRequired: !this.parsedArguments.artist,
    });

    const artistName = await this.lastFMArguments.getArtist(
      senderRequestable,
      !this.parsedArguments.noRedirect
    );

    const crown = await this.crownsService.getCrown(artistName, this.guild.id);

    if (this.variationWasUsed("update")) {
      await this.updateAndWait(this.author.id);
    }

    const response = await this.query({
      artist: { name: artistName },
      settings: { guildID: this.guild.id, limit: 15 },
      serverID: this.guild.id,
      user: { discordID: this.author.id },
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new MirrorballError(errors.errors[0].message);
    }

    await this.nicknameService.cacheNicknames(
      response.whoKnowsArtist.rows.map((u) => u.user),
      this.guild.id,
      this.gowonClient
    );

    const { rows, artist } = response.whoKnowsArtist;
    const { rank, playcount } = response.artistRank;

    const lineConsolidator = new LineConsolidator();

    console.log(rank > 15);

    lineConsolidator.addLines(
      {
        shouldDisplay: !artist || rows.length === 0,
        string: "No one knows this artist",
      },
      {
        shouldDisplay: artist && rows.length !== 0,
        string: displayNumberedList(
          rows.map((wk) => {
            const nickname = this.nicknameService.cacheGetNickname(
              wk.user.discordID
            );

            const isUnknown = nickname === UnknownUserDisplay;

            if (isUnknown) {
              this.whoKnowsService.recordUnknownMember(
                this.guild.id,
                wk.user.discordID
              );
            }

            const nicknameDisplay = isUnknown
              ? nickname
              : displayLink(nickname, LinkGenerator.userPage(wk.user.username));

            return `${
              wk.user.discordID === senderUser?.discordID
                ? nicknameDisplay.strong()
                : nicknameDisplay
            } - **${displayNumber(wk.playcount, "**play")}${
              crown?.user?.discordID === wk.user.discordID ? " 👑" : ""
            }`;
          })
        ),
      },
      {
        shouldDisplay: rank > 15 && !!senderUser,
        string: `\n\`${rank}.\` ${displayLink(
          this.message.member?.nickname || this.message.author.username,
          LinkGenerator.userPage(senderUser?.lastFMUsername!)
        ).strong()} - **${displayNumber(playcount, "**play")}${
          crown?.user?.discordID === this.author.id ? " 👑" : ""
        }`,
      }
    );

    const embed = this.whoKnowsEmbed()
      .setTitle(`Who knows ${artist.name.strong()}?`)
      .setDescription(lineConsolidator.consolidate())
      .setFooter(
        senderUser?.isIndexed
          ? ""
          : `Don't see yourself? Run ${this.prefix}index to download all your data!`
      );

    await this.send(embed);
  }
}
