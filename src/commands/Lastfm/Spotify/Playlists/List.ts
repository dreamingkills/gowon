import {
  displayNumber,
  displayNumberedList,
} from "../../../../lib/views/displays";
import { SimpleScrollingEmbed } from "../../../../lib/views/embeds/SimpleScrollingEmbed";
import { PlaylistChildCommand } from "./PlaylistChildCommand";

export class List extends PlaylistChildCommand {
  idSeed = "pink fantasy yechan";

  description = "Lists your Spotify playlists";

  async run() {
    const { dbUser } = await this.getMentions({ fetchSpotifyToken: true });

    this.access.checkAndThrow(dbUser);

    const playlists = await this.spotifyService.getPlaylists(this.ctx);

    await this.spotifyPlaylistTagService.getTagsForPlaylists(
      this.ctx,
      dbUser,
      playlists.items
    );

    const defaultPlaylist = this.spotifyPlaylistTagService.getDefaultPlaylist(
      this.ctx
    );

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Spotify playlists"))
      .setTitle(`Your Spotify playlists`);

    const simpleScrollingEmbed = new SimpleScrollingEmbed(this.ctx, embed, {
      items: playlists.items,
      pageSize: 15,
      pageRenderer(items, { offset }) {
        return displayNumberedList(
          items.map(
            (p) =>
              `${p.tag?.emoji || "◻️"} ${p.name.strong()} (${displayNumber(
                p.tracksCount,
                "track"
              )}) ${defaultPlaylist?.playlistID === p.id ? "— *default*" : ""}`
          ),
          offset
        );
      },
      overrides: { itemName: "playlist" },
    });

    simpleScrollingEmbed.send();
  }
}
