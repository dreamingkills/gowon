import { FriendsChildCommand } from "../FriendsChildCommand";
import { MultiRequester } from "../../../../lib/MultiRequester";
import { displayNumber } from "../../../../lib/views/displays";
import { TimeRangeArgument } from "../../../../lib/context/arguments/argumentTypes/timeAndDate/TimeRangeArgument";
import { TimeRange } from "../../../../lib/timeAndDate/TimeRange";
import { code } from "../../../../helpers/discord";

const args = {
  timeRange: new TimeRangeArgument({
    useOverall: true,
    default: () => TimeRange.overall(),
  }),
} as const;

export class Scrobbles extends FriendsChildCommand<typeof args> {
  idSeed = "nature sohee";

  description = "Shows how many scrobbles your friends have";
  aliases = ["s"];
  usage = ["", "time period"];

  arguments = args;

  throwIfNoFriends = true;

  async run() {
    const timeRange = this.parsedArguments.timeRange;

    const scrobbles = await new MultiRequester(this.ctx, [
      ...this.friendUsernames,
      this.senderRequestable,
    ]).fetch(this.lastFMService.getNumberScrobbles.bind(this.lastFMService), [
      timeRange.from,
      timeRange.to,
    ]);

    const embed = this.newEmbed()
      .setTitle(`Your friends scrobbles ${timeRange.humanized}`)
      .setDescription(
        Object.keys(scrobbles)
          .sort(
            (a, b) => (scrobbles[b] ?? -Infinity) - (scrobbles[a] ?? -Infinity)
          )
          .map((username) => {
            let s = scrobbles[username];

            if (!s)
              return this.displayMissingFriend(username, "scrobble count");

            return `${code(username)} - **${displayNumber(s, "**scrobble")}`;
          })
          .join("\n")
      );

    await this.send(embed);
  }
}
