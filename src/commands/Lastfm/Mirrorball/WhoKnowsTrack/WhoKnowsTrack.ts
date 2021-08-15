import { MirrorballError } from "../../../../errors";
import { LinkGenerator } from "../../../../helpers/lastFM";
import { Arguments } from "../../../../lib/arguments/arguments";
import { Variation } from "../../../../lib/command/BaseCommand";
import { MirrorballBaseCommand } from "../../../../lib/indexing/MirrorballCommands";
import {
  displayLink,
  displayNumber,
  displayNumberedList,
} from "../../../../lib/views/displays";
import { NicknameService } from "../../../../services/guilds/NicknameService";
import {
  WhoKnowsTrackConnector,
  WhoKnowsTrackParams,
  WhoKnowsTrackResponse,
} from "./WhoKnowsTrack.connector";

const args = {
  inputs: {
    artist: { index: 0, splitOn: "|" },
    track: { index: 1, splitOn: "|" },
  },
} as const;

export default class WhoKnowsTrack extends MirrorballBaseCommand<
  WhoKnowsTrackResponse,
  WhoKnowsTrackParams,
  typeof args
> {
  connector = new WhoKnowsTrackConnector();

  idSeed = "redsquare lina";

  aliases = ["wkt", "fmwkt"];
  subcategory = "whoknows";

  variations: Variation[] = [{ name: "update", variation: "uwkt" }];

  description = "See who knows a track";

  arguments: Arguments = args;

  nicknameService = new NicknameService(this.logger);

  async run() {
    const { senderRequestable, senderUser } = await this.parseMentions({
      senderRequired:
        !this.parsedArguments.artist || !this.parsedArguments.track,
    });

    const { artist: artistName, track: trackName } =
      await this.lastFMArguments.getTrack(senderRequestable);

    if (this.variationWasUsed("update")) {
      await this.updateAndWait(this.author.id);
    }

    const response = await this.query({
      track: { name: trackName, artist: { name: artistName } },
      settings: { guildID: this.guild.id, limit: 20 },
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new MirrorballError(errors.errors[0].message);
    }

    const { rows, track } = response.whoKnowsTrack;

    await this.nicknameService.cacheNicknames(
      response.whoKnowsTrack.rows.map((u) => u.user),
      this.guild.id,
      this.gowonClient
    );

    let trackDisplay = track.name;
    let artistDisplay = track.artist;

    if (!trackDisplay && !artistDisplay) {
      const trackResponse = await this.lastFMService.correctTrack({
        artist: artistName,
        track: trackName,
      });

      trackDisplay = trackResponse.track;
      artistDisplay = trackResponse.artist;
    }

    const embed = this.whoKnowsEmbed()
      .setTitle(
        `Who knows ${trackDisplay.italic()} by ${artistDisplay.strong()}?`
      )
      .setDescription(
        !track || rows.length === 0
          ? `No one knows this track`
          : displayNumberedList(
              rows.map((wk) => {
                const nickname = displayLink(
                  this.nicknameService.cacheGetNickname(wk.user.discordID),
                  LinkGenerator.userPage(wk.user.username)
                );

                return `${
                  wk.user.discordID === senderUser?.discordID
                    ? nickname.strong()
                    : nickname
                } - **${displayNumber(wk.playcount, "**play")}`;
              })
            )
      );

    await this.send(embed);
  }
}
