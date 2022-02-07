import { Setting } from "../../database/entity/Setting";
import { BaseService } from "../../services/BaseService";
import { GowonContext } from "../context/Context";
import { Settings, SettingsMap } from "./Settings";
import {
  UserScope,
  GuildMemberScope,
  GuildScope,
  BaseSetting,
  BotScope,
} from "./SettingTypes";

type SettingName = keyof SettingsMap;
type Scope = UserScope | GuildMemberScope | GuildScope | BotScope;

interface Cache {
  [setting: string]: {
    [scope: string]: string;
  };
}

export class SettingsService extends BaseService {
  public cache: Cache;

  constructor() {
    super();
    this.cache = Object.keys(Settings).reduce((acc, val) => {
      const setting: BaseSetting = (Settings as any)[val];
      acc[setting.name] = {};

      return acc;
    }, {} as Cache);
  }

  async init() {
    const settings = await this.getAllSettings();

    for (const setting of settings) {
      const scope = this.buildScope(setting);

      if (this.cache[setting.name]) {
        this.cache[setting.name][scope] = setting.value;
      }
    }
  }

  get(settingName: keyof SettingsMap, scope: Scope): string | undefined {
    const setting = Settings[settingName];
    const stringScope = JSON.stringify(setting.transformScope(scope as any));

    return this.cache[setting.name][stringScope];
  }

  async set(
    ctx: GowonContext,
    settingName: SettingName,
    scope: Scope,
    value?: string
  ): Promise<Setting | undefined> {
    this.log(ctx, `Setting ${settingName} for ${JSON.stringify(scope)}`);

    const setting = Settings[settingName];
    const stringScope = JSON.stringify(setting.transformScope(scope as any));

    const newSetting = await setting.createUpdateOrDelete(scope as any, value);

    this.updateCache(setting.name, stringScope, newSetting);

    return newSetting;
  }

  private buildScope(setting: Setting): string {
    const scope: { scope?: string; secondaryScope?: string } = {};

    if (setting.scope) scope.scope = setting.scope;
    if (setting.secondaryScope) scope.secondaryScope = setting.secondaryScope;

    return JSON.stringify(scope);
  }

  private async getAllSettings() {
    return await Setting.find();
  }

  private updateCache(settingName: string, scope: string, setting?: Setting) {
    if (!setting) {
      delete this.cache[settingName][scope];
    } else {
      this.cache[settingName][scope] = setting.value;
    }
  }
}