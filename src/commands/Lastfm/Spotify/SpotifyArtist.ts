import { LogicError } from "../../../errors";
import { Arguments } from "../../../lib/arguments/arguments";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";
import { SpotifyBaseCommand } from "./SpotifyBaseCommand";

export default class SpotifyArtist extends SpotifyBaseCommand {
  idSeed = "iz*one chaeyeon";

  description = "Links the spotify page for an artist";
  aliases = ["fmsa", "spa"];

  arguments: Arguments = {
    inputs: {
      keywords: { index: { start: 0 } },
    },
    mentions: standardMentions,
  };

  async run() {
    let keywords = this.parsedArguments.keywords as string;

    let { username } = await this.parseMentions({
      usernameRequired: !keywords,
    });

    if (!keywords) {
      let nowplaying = await this.lastFMService.nowPlayingParsed(username);

      keywords = nowplaying.artist;
    }

    const spotifyArtist = await this.spotifyService.searchArtist(keywords);

    if (!spotifyArtist)
      throw new LogicError(
        `that artist wasn't found on spotify! Searched with \`${keywords}\``
      );

    await this.send(spotifyArtist.external_urls.spotify);
  }
}