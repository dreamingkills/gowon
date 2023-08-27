import { AnyIn, BaseCompoundComponent } from "../base/BaseNowPlayingComponent";

const lovedAndOwnedRequirements = [
  "trackInfo",
  "albumCard",
  "cachedLovedTrack",
] as const;

export class LovedAndOwnedComponent extends BaseCompoundComponent<
  typeof lovedAndOwnedRequirements
> {
  requirements = lovedAndOwnedRequirements;

  static componentName = "loved-and-owned";
  static replaces = new AnyIn(["loved", "card-ownership"]);

  async present() {
    const loved =
      this.values.trackInfo?.loved || !!this.values.cachedLovedTrack;
    const owned =
      this.values.albumCard &&
      this.values.albumCard.owner.id === this.values.dbUser.id;

    if (owned && loved) {
      return { size: 0, string: "💖" };
    } else if (owned) {
      return { size: 0, string: "✨" };
    } else if (loved) {
      return { size: 0, string: "❤️" };
    } else {
      return { string: "", size: 0 };
    }
  }
}
