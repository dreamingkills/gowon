import regexEscape from "escape-string-regexp";
import { Guild } from "discord.js";
import config from "../../config.json";
import { CacheScopedKey, ShallowCache } from "../database/cache/ShallowCache";
import { CrownBan } from "../database/entity/CrownBan";
import { ArtistCrownBan } from "../database/entity/ArtistCrownBan";
import { RunAs } from "../lib/command/RunAs";
import { SettingsService } from "../lib/settings/SettingsService";
import { ServiceRegistry } from "./ServicesRegistry";

export const gowonServiceConstants = {
  hardPageLimit: 10,
  crownThreshold: 30,
  dateParsers: [
    "yy-MM-dd",
    "yyyy-MM-dd",
    "yy/MM/dd",
    "yyyy/MM/dd",
    "yy.MM.dd",
    "yyyy.MM.dd",
  ] as string[],
  unknownUserDisplay: "???",
  defaultLoadingTime: 5,
} as const;

export class GowonService {
  shallowCache = new ShallowCache();

  constants = gowonServiceConstants;

  private get settingsService() {
    return ServiceRegistry.get(SettingsService);
  }

  prefix(guildID: string): string {
    return (
      this.settingsService.get("prefix", { guildID }) || config.defaultPrefix
    );
  }

  regexSafePrefix(serverID: string): string {
    return regexEscape(this.prefix(serverID));
  }

  removeCommandName(string: string, runAs: RunAs, serverID: string): string {
    return string
      .replace(
        new RegExp(
          `${this.regexSafePrefix(serverID)}${runAs.toRegexString()}`,
          "i"
        ),
        ""
      )
      .trim();
  }

  async getInactiveRole(guild: Guild): Promise<string | undefined> {
    return this.settingsService.get("inactiveRole", { guildID: guild.id });
  }

  async getPurgatoryRole(guild: Guild): Promise<string | undefined> {
    return this.settingsService.get("purgatoryRole", { guildID: guild.id });
  }

  async getCrownBannedUsers(guild: Guild): Promise<string[]> {
    return await this.shallowCache.findOrRemember<string[]>(
      CacheScopedKey.CrownBannedUsers,
      async () => {
        let bans = (
          await CrownBan.find({
            where: { serverID: guild.id },
          })
        ).map((u) => u.user.discordID);

        return bans;
      },
      guild.id
    );
  }

  async isUserCrownBanned(guild: Guild, discordID: string): Promise<boolean> {
    return (await this.getCrownBannedUsers(guild)).includes(discordID);
  }

  async getCrownBannedArtists(guild: Guild): Promise<string[]> {
    return await this.shallowCache.findOrRemember<string[]>(
      CacheScopedKey.CrownBannedArtists,
      async () => {
        let bans = (
          await ArtistCrownBan.find({
            where: { serverID: guild.id },
          })
        ).map((u) => u.artistName);

        return bans;
      },
      guild.id
    );
  }

  async isArtistCrownBanned(
    guild: Guild,
    artistName: string
  ): Promise<boolean> {
    return (await this.getCrownBannedArtists(guild))
      .map((a) => a.toLowerCase())
      .includes(artistName.toLowerCase());
  }
}
