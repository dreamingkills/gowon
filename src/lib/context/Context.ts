import { Guild, GuildMember, Message, User } from "discord.js";
import { BaseCommand } from "../command/BaseCommand";
import { RunAs } from "../command/RunAs";
import { GowonClient } from "../GowonClient";
import { Logger } from "../Logger";

export interface CustomContext<C, M> {
  constants?: C;
  mutable?: M;
}

export interface ContextParamaters<CustomContextT> {
  command: BaseCommand;
  custom: CustomContextT;
  message: Message;
  runAs: RunAs;
  gowonClient: GowonClient;
}

export class GowonContext<
  T extends CustomContext<any, any> = CustomContext<{}, {}>
> {
  private _command: BaseCommand;
  private custom: T;
  private _message: Message;
  private _runAs: RunAs;
  private gowonClient: GowonClient;

  get mutable(): NonNullable<T["mutable"]> {
    if (!this.custom.mutable) this.custom.mutable = {};

    return this.custom.mutable!;
  }

  get constants(): NonNullable<T["constants"]> {
    if (!this.custom.constants) this.custom.constants = {};

    return this.custom.constants!;
  }

  constructor(params: ContextParamaters<T>) {
    this._command = params.command;
    this._message = params.message;
    this.custom = params.custom;
    this._runAs = params.runAs;
    this.gowonClient = params.gowonClient;
  }

  public addContext(context: T) {
    this.custom = Object.assign(this.custom, context);
  }

  get message(): Message {
    return this._message;
  }

  get runAs(): RunAs {
    return this._runAs;
  }

  get guild(): Guild {
    return this.message.guild!;
  }

  get author(): User {
    return this.message.author;
  }

  get authorMember(): GuildMember {
    return this.message.member!;
  }

  get client(): GowonClient {
    return this.gowonClient;
  }

  get logger(): Logger {
    return this._command.logger;
  }

  get command(): BaseCommand {
    return this._command;
  }

  // Used to set commands from non-command places
  public dangerousSetCommand(command: any) {
    this._command = Object.assign(this._command || {}, command);
  }
}

export type UnwrapContext<T extends GowonContext<CustomContext<any, any>>> =
  T extends GowonContext<infer U> ? U : never;