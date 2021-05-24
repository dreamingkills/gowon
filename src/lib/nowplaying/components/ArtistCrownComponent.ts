import { User } from "../../../database/entity/User";
import { numberDisplay } from "../../../helpers";
import { BaseNowPlayingComponent } from "./BaseNowPlayingComponent";

const artistCrownRequirements = ["artistCrown"] as const;

export class ArtistCrownComponent extends BaseNowPlayingComponent<
  typeof artistCrownRequirements
> {
  static componentName = "artist-crown";
  readonly requirements = artistCrownRequirements;

  async present() {
    if (this.values.artistCrown) {
      const crown = this.values.artistCrown!;

      if (await User.stillInServer(this.values.message, crown.user?.id)) {
        return {
          string: `👑 ${numberDisplay(crown.crown.plays)} (${
            crown.user!.username
          })`,
          size: 1,
        };
      }
    }

    return {
      string: "",
      size: 0,
    };
  }
}
