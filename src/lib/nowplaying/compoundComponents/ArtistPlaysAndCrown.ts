import { User } from "../../../database/entity/User";
import { displayNumber } from "../../views/displays";
import { BaseCompoundComponent } from "../components/BaseNowPlayingComponent";

const requirements = ["artistInfo", "artistCrown"] as const;

export class ArtistPlaysAndCrownComponent extends BaseCompoundComponent<
  typeof requirements
> {
  requirements = requirements;

  static componentName = "artist-plays-and-crown";
  static replaces = ["artist-plays", "artist-crown"];

  async present() {
    const crown = this.values.artistCrown;

    let crownString = "";
    let isCrownHolder = false;

    if (crown && crown.user) {
      if (crown.user.id === this.values.message.author.id) {
        isCrownHolder = true;
      } else {
        if (await User.stillInServer(this.values.message, crown.user.id)) {
          crownString = `👑 ${displayNumber(crown.crown.plays)} (${
            crown.user.username
          })`;
        }
      }
    }

    let artistPlaysString = "";
    let artistExists = false;

    if (this.values.artistInfo) {
      artistPlaysString = `${displayNumber(
        this.values.artistInfo.userPlaycount,
        `${this.values.artistInfo.name} scrobble`
      )}`;
      artistExists = true;
    } else {
      artistPlaysString = `No data on last.fm for ${this.nowPlaying.artist}`;
    }

    return !artistExists
      ? { string: artistPlaysString, size: 1 }
      : isCrownHolder
      ? { string: "👑" + artistPlaysString, size: 1 }
      : [
          { string: `${artistPlaysString}`, size: 1 },
          {
            string: crownString,
            size: 1,
            placeAfter: ["track-plays", "album-plays", "artist-plays"],
          },
        ];
  }
}
