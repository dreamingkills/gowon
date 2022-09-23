import { FriendsChildCommand } from "../FriendsChildCommand";
import gql from "graphql-tag";
import { RatingResponse } from "../../Mirrorball/RateYourMusic/connectors";
import { displayNumber, displayRating } from "../../../../lib/views/displays";
import { LogicError } from "../../../../errors/errors";
import { mean } from "mathjs";
import { asyncMap } from "../../../../helpers";
import { prefabArguments } from "../../../../lib/context/arguments/prefabArguments";
import { code } from "../../../../helpers/discord";
import { ServiceRegistry } from "../../../../services/ServicesRegistry";
import { AlbumCoverService } from "../../../../services/moderation/AlbumCoverService";

const args = {
  ...prefabArguments.album,
} as const;

export class Rating extends FriendsChildCommand<typeof args> {
  idSeed = "hot issue dana";

  description = "Shows what your friends have rated an album";
  aliases = ["ratings", "ra"];
  usage = ["", "artist | album"];

  arguments = args;

  throwIfNoFriends = true;

  albumCoverService = ServiceRegistry.get(AlbumCoverService);

  async run() {
    const { senderUser, senderUsername } = await this.getMentions({
      senderRequired: true,
    });

    const { artist, album } = await this.lastFMArguments.getAlbum(
      this.ctx,
      this.senderRequestable
    );

    const query = gql`
      query friendsRatings($user: UserInput!, $album: AlbumInput!) {
        ratings(
          settings: { user: $user, album: $album, pageInput: { limit: 1 } }
        ) {
          ratings {
            rating
            rateYourMusicAlbum {
              title
              artistName
            }
          }
        }
      }
    `;

    const friends = await this.friendsService.listFriends(
      this.ctx,
      senderUser!
    );

    const friendIDs = [
      ...(friends.map((f) => f.friend?.discordID).filter((f) => !!f) || []),
      this.author.id,
    ];

    const ratings = (await asyncMap(friendIDs, async (friendID) => {
      const response = await this.mirrorballService.query(this.ctx, query, {
        user: { discordID: friendID },
        album: { name: album, artist: { name: artist } },
      });

      const friend = friends.find((f) => f.friend?.discordID === friendID);

      return [
        friendID === this.author.id
          ? senderUsername
          : friend?.friend?.lastFMUsername!,
        response,
      ];
    })) as [string, RatingResponse][];

    const filteredRatings = ratings.filter((r) => r[1].ratings.ratings.length);

    if (!filteredRatings.length) {
      throw new LogicError(
        `Couldn't find that album in your or your friends' ratings!`
      );
    }

    const { rateYourMusicAlbum } = filteredRatings[0][1].ratings.ratings[0];

    const albumInfo = await this.lastFMService.albumInfo(this.ctx, {
      artist,
      album,
    });

    const albumCover = await this.albumCoverService.get(
      this.ctx,
      albumInfo.images.get("large"),
      {
        metadata: { artist, album },
      }
    );

    const embed = this.newEmbed()
      .setTitle(
        `Your friends ratings of ${rateYourMusicAlbum.title} by ${rateYourMusicAlbum.artistName}`
      )
      .setDescription(
        `_Average ${(
          (mean(
            filteredRatings.map((r) => r[1].ratings.ratings[0].rating)
          ) as number) / 2
        ).toFixed(2)}/5 from ${displayNumber(
          filteredRatings.length,
          "rating"
        )}_\n\n` +
          filteredRatings
            .sort(
              (a, b) =>
                b[1].ratings.ratings[0].rating - a[1].ratings.ratings[0].rating
            )
            .map(
              ([username, rating]) =>
                `${code(username)} - ${displayRating(
                  rating.ratings.ratings[0].rating
                )}`
            )
            .join("\n")
      )
      .setThumbnail(albumCover || "");

    await this.send(embed);
  }
}
