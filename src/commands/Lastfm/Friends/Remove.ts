import { FriendsChildCommand } from "./FriendsChildCommand";
import { LogicError } from "../../../errors";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { standardMentions } from "../../../lib/context/arguments/mentionTypes/mentions";
import { StringArgument } from "../../../lib/context/arguments/argumentTypes/StringArgument";

const args = {
  ...standardMentions,
  friendUsername: new StringArgument(),
};

export class Remove extends FriendsChildCommand<typeof args> {
  idSeed = "nature haru";

  aliases = ["removefriend", "removefriends"];
  description = "Removes a friend";
  usage = ["lfm_username", "@user"];

  arguments = args;

  validation: Validation = {
    user: {
      validator: new validators.Required({
        message: "please specify a friend to remove!",
      }),
      dependsOn: ["friendUsername", "userID", "lastfmUsername"],
    },
  };

  async prerun() {}

  async run() {
    const { username, senderUsername, senderUser, mentionedDBUser } =
      await this.getMentions({
        inputArgumentName: "friendUsername",
        senderRequired: true,
      });

    if (username === senderUsername) {
      throw new LogicError("you can't be friends with yourself!");
    }

    await this.friendsService.removeFriend(
      this.ctx,
      senderUser!,
      mentionedDBUser || username
    );

    await this.send(
      this.newEmbed().setDescription(
        `Successfully removed ${username.code()} as a friend!`
      )
    );
  }
}
