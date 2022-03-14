import { LogicError } from "../../../errors/errors";
import { Variation } from "../../../lib/command/BaseCommand";
import { prefabArguments } from "../../../lib/context/arguments/prefabArguments";
import { LineConsolidator } from "../../../lib/LineConsolidator";
import { SpotifyChildCommand } from "./SpotifyChildCommand";

const args = {
  ...prefabArguments.track,
} as const;

export class Like extends SpotifyChildCommand<typeof args> {
  idSeed = "pink fantasy daewang";

  description = "Adds a song to your Spotify liked songs";
  aliases = ["slike", "like"];
  usage = ["", "artist | song", "(in reply to a Spotify song link)"];

  slashCommand = true;

  variations: Variation[] = [
    {
      name: "unlike",
      description: "Removes a song from your Spotify liked songs",
      variation: ["unlike"],
    },
  ];

  arguments = args;

  async run() {
    const unlike = this.variationWasUsed("unlike");

    const { senderRequestable } = await this.getMentions({
      fetchSpotifyToken: true,
    });

    const track = await this.spotifyArguments.getTrack(
      this.ctx,
      senderRequestable,
      { confirm: true }
    );

    if (!track) {
      throw new LogicError(
        `Couldn't find a track to ${unlike ? "un" : ""}like!`
      );
    }

    const trackInLibrary = await this.spotifyService.checkIfSongIsInLibrary(
      this.ctx,
      track.uri.asID
    );

    if (unlike) {
      await this.spotifyService.removeTrackFromLibrary(
        this.ctx,
        track.uri.asID
      );
    } else {
      await this.spotifyService.saveTrackToLibrary(this.ctx, track.uri.asID);
    }

    const lineConsolidator = new LineConsolidator();

    const artistName = track.artists.primary.name.strong();
    const trackName = track.name.italic();

    lineConsolidator.addLines(
      {
        shouldDisplay: unlike && trackInLibrary,
        string: `💔 Succesfully unliked:\n${trackName} by ${artistName}!`,
      },
      {
        shouldDisplay: unlike && !trackInLibrary,
        string: `❤️‍🩹 Already not in your library:\n${trackName} by ${artistName}`,
      },
      {
        shouldDisplay: !unlike && !trackInLibrary,
        string: `❤️ Succesfully liked:\n${trackName} by ${artistName}!`,
      },
      {
        shouldDisplay: !unlike && trackInLibrary,
        string: `💞 Already in your library:\n${trackName} by ${artistName}`,
      }
    );

    const embed = this.newEmbed()
      .setAuthor(
        this.generateEmbedAuthor(`Spotify ${unlike ? "un" : ""}like song`)
      )
      .setDescription(lineConsolidator.consolidate())
      .setThumbnail(track.album.images.largest.url);

    await this.send(embed);
  }
}
