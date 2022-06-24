import { NowPlayingBaseCommand, nowPlayingArgs } from "./NowPlayingBaseCommand";
import { ServiceRegistry } from "../../../services/ServicesRegistry";
import { TrackInfo } from "../../../services/LastFM/converters/InfoTypes";
import { RecentTrack } from "../../../services/LastFM/converters/RecentTracks";
import { LastFMArgumentsMutableContext } from "../../../services/LastFM/LastFMArguments";
import { DatasourceService } from "../../../lib/nowplaying/DatasourceService";
import { ConfigService } from "../../../services/dbservices/NowPlayingService";
import { NowPlayingBuilder } from "../../../lib/nowplaying/NowPlayingBuilder";
import { RequirementMap } from "../../../lib/nowplaying/RequirementMap";
import { LinkGenerator } from "../../../helpers/lastFM";
import { prefabArguments } from "../../../lib/context/arguments/prefabArguments";

const args = {
  ...prefabArguments.track,
  ...nowPlayingArgs,
};

export default class FakeNowPlaying extends NowPlayingBaseCommand<typeof args> {
  idSeed = "april jinsol";

  aliases = ["track"];

  arguments = args;

  description =
    "Displays any given track as if it were your currently playing song";
  usage = ["search term", "artist | track"];

  slashCommand = true;

  datasourceService = ServiceRegistry.get(DatasourceService);
  configService = ServiceRegistry.get(ConfigService);

  async run() {
    const { dbUser, senderRequestable, requestable, username } =
      await this.getMentions({
        senderRequired: true,
      });

    const { artist, track } = await this.lastFMArguments.getTrack(
      this.ctx,
      senderRequestable
    );

    let recentTrack: RecentTrack;

    const mutableContext =
      this.mutableContext<LastFMArgumentsMutableContext>().mutable;

    if (mutableContext.nowplaying || mutableContext.parsedNowplaying) {
      recentTrack = (mutableContext.nowplaying ||
        mutableContext.parsedNowplaying)!;
    } else {
      const trackInfo = await this.lastFMService.trackInfo(this.ctx, {
        artist,
        track,
      });

      recentTrack = this.recentTrackFromTrackInfo(trackInfo);
    }

    const recentTracks = await this.lastFMService.recentTracks(this.ctx, {
      username: senderRequestable,
      limit: 1,
    });

    recentTracks.tracks[0] = recentTrack;

    const config = await this.configService.getConfigForUser(this.ctx, dbUser!);

    const builder = new NowPlayingBuilder(config);

    const requirements = builder.generateRequirements();

    const resolvedRequirements =
      await this.datasourceService.resolveRequirements(
        this.ctx,
        requirements as (keyof RequirementMap)[],
        {
          recentTracks,
          requestable,
          username,
          dbUser,
          payload: this.payload,
          components: config,
          prefix: this.prefix,
        }
      );

    const baseEmbed = this.nowPlayingEmbed(
      recentTracks.first(),
      username
    ).setAuthor(
      this.generateEmbedAuthor(
        `Track for ${username}`,
        LinkGenerator.userPage(username)
      )
    );

    const embed = await builder.asEmbed(resolvedRequirements, baseEmbed);

    const sentMessage = await this.send(embed);

    await this.customReactions(sentMessage);
    await this.easterEggs(sentMessage, recentTracks.first());
  }

  private recentTrackFromTrackInfo(track: TrackInfo): RecentTrack {
    return new RecentTrack({
      artist: { mbid: "", "#text": track.artist.name },
      "@attr": { nowplaying: "1" },
      mbid: "",
      album: { mbid: "", "#text": track.album?.name || "" },
      image: track.album
        ? [{ size: "large", "#text": track.album?.images.get("large")! }]
        : [],
      streamable: "1",
      url: "",
      name: track.name,
      date: {
        uts: `${new Date().getTime()}`,
        "#text": "",
      },
    });
  }
}
