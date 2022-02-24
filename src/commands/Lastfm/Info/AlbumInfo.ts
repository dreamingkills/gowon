import { InfoCommand } from "./InfoCommand";
import { calculatePercent } from "../../../helpers/stats";
import { LinkConsolidator } from "../../../helpers/lastFM";
import { LineConsolidator } from "../../../lib/LineConsolidator";
import { displayNumber } from "../../../lib/views/displays";
import { standardMentions } from "../../../lib/context/arguments/mentionTypes/mentions";
import { prefabArguments } from "../../../lib/context/arguments/prefabArguments";

const args = {
  ...standardMentions,
  ...prefabArguments.album,
} as const;

export default class AlbumInfo extends InfoCommand<typeof args> {
  idSeed = "nature uchae";

  shouldBeIndexed = true;

  aliases = ["ali", "li", "als", "ls"];
  description = "Displays some information about an album";
  usage = ["", "artist | album"];

  arguments = args;

  customContext = { mutable: {} };

  lineConsolidator = new LineConsolidator();

  async run() {
    const { senderRequestable, requestable, perspective } =
      await this.getMentions({
        senderRequired:
          !this.parsedArguments.artist || !this.parsedArguments.album,
      });

    const { artist, album } = await this.lastFMArguments.getAlbum(
      this.ctx,
      senderRequestable
    );

    const [albumInfo, userInfo, spotifyAlbumSearch] = await Promise.all([
      this.lastFMService.albumInfo(this.ctx, {
        artist,
        album,
        username: requestable,
      }),
      this.lastFMService.userInfo(this.ctx, { username: requestable }),
      this.spotifyService.searchAlbum(this.ctx, { artist, album }),
    ]);

    await this.tagConsolidator.saveServerBannedTagsInContext(this.ctx);
    this.tagConsolidator.blacklistTags(albumInfo.artist, albumInfo.name);
    this.tagConsolidator.addTags(this.ctx, albumInfo.tags);

    const linkConsolidator = new LinkConsolidator([
      LinkConsolidator.spotify(
        spotifyAlbumSearch.hasAnyResults
          ? spotifyAlbumSearch.bestResult.externalURLs.spotify
          : undefined
      ),
      LinkConsolidator.lastfm(albumInfo.url),
    ]);

    const albumDuration = albumInfo.tracks.reduce(
      (sum, t) => sum + t.duration,
      0
    );

    const spotifyAlbumArt =
      spotifyAlbumSearch.hasAnyResults &&
      spotifyAlbumSearch.bestResult.isExactMatch
        ? spotifyAlbumSearch.bestResult.images.largest
        : undefined;

    this.lineConsolidator.addLines(
      {
        shouldDisplay: albumInfo.tracks.length > 0 && !!albumDuration,
        string: `_${displayNumber(
          albumInfo.tracks.length,
          "track"
        )} (${displayNumber(Math.ceil(albumDuration / 60), "minute")})_`,
      },
      {
        shouldDisplay: albumInfo.tracks.length > 0 && !albumDuration,
        string: `_${displayNumber(albumInfo.tracks.length, "track")}_`,
      },
      {
        shouldDisplay: albumInfo.tracks.length > 0,
        string: "",
      },
      {
        shouldDisplay: !!albumInfo.wiki?.summary?.trim(),
        string: this.scrubReadMore(albumInfo.wiki?.summary.trimRight())!,
      },
      {
        shouldDisplay: !!albumInfo.wiki?.summary?.trim(),
        string: "",
      },
      {
        shouldDisplay: this.tagConsolidator.hasAnyTags(),
        string: `**Tags:** ${this.tagConsolidator
          .consolidateAsStrings()
          .join(" ‧ ")}`,
      },
      {
        shouldDisplay: linkConsolidator.hasLinks(),
        string: `**Links**: ${linkConsolidator.consolidate()}`,
      }
    );

    const percentage = calculatePercent(
      albumInfo.userPlaycount,
      albumInfo.globalPlaycount
    );

    const embed = this.newEmbed()
      .setTitle(albumInfo.name.italic() + " by " + albumInfo.artist.strong())
      .setDescription(this.lineConsolidator.consolidate())
      .setURL(albumInfo.url)
      .setImage(albumInfo.images.get("large") || spotifyAlbumArt?.url || "")
      .addFields(
        {
          name: "Listeners",
          value: displayNumber(albumInfo.listeners),
          inline: true,
        },
        {
          name: "Playcount",
          value: displayNumber(albumInfo.globalPlaycount),
          inline: true,
        },
        {
          name: `${perspective.upper.possessive} stats`,
          value: `
        \`${displayNumber(albumInfo.userPlaycount, "` play", true)} by ${
            perspective.objectPronoun
          } (${calculatePercent(
            albumInfo.userPlaycount,
            userInfo.scrobbleCount,
            4
          ).strong()}% of ${perspective.possessivePronoun} total scrobbles)
        ${
          parseFloat(percentage) > 0
            ? `${perspective.upper.regularVerb(
                "account"
              )} for ${percentage.strong()}% of all scrobbles of this album!`
            : ""
        }`,
        }
      )
      .setFooter({
        text: albumInfo.images.get("large")
          ? "Image source: Last.fm"
          : spotifyAlbumArt && spotifyAlbumArt.url
          ? "Image source: Spotify"
          : "",
      });

    this.send(embed);
  }
}
