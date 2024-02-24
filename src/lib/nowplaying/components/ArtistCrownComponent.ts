import { DiscordService } from "../../../services/Discord/DiscordService";
import { ServiceRegistry } from "../../../services/ServicesRegistry";
import { NativeEmoji } from "../../emoji/nativeEmojis";
import { displayNumber } from "../../ui/displays";
import { BaseNowPlayingComponent } from "../base/BaseNowPlayingComponent";

const artistCrownDependencies = ["artistCrown"] as const;

export class ArtistCrownComponent extends BaseNowPlayingComponent<
  typeof artistCrownDependencies
> {
  static componentName = "artist-crown";
  static friendlyName = "Artist crown";
  readonly dependencies = artistCrownDependencies;

  async render() {
    if (this.values.artistCrown) {
      const crown = this.values.artistCrown!;

      const userInServer = !crown.user
        ? false
        : await ServiceRegistry.get(DiscordService).userInServer(
            this.ctx,
            crown.user?.id
          );

      if (userInServer) {
        return {
          string: `${NativeEmoji.crown} ${displayNumber(crown.crown.plays)} (${
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
