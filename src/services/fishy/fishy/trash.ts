import { TrashEmoji } from "../../../lib/emoji/FishyEmoji";
import { BaseFishy } from "../classes/BaseFishy";
import { Fishy, FishyRarities } from "../classes/Fishy";

export const trash = [
  new Fishy({
    id: "old-boot",
    name: "Old boot",
    binomialName: "Vetus calceus",
    rarity: FishyRarities.Trash,
    emoji: new TrashEmoji("👢", "<:obSilhouette:1091509618280243330>"),
    description: "Someone must've lost their boot in the water...",
    weight: { min: 0, max: 0 },
  }),

  new Fishy({
    id: "favourite-album",
    name: "A copy of your favourite album",
    binomialName: "Malus musica",
    rarity: FishyRarities.Trash,
    description: "Unless your favourite album is Loona's Go Won of course",
    emoji: new TrashEmoji("💿", "<:yfaSilhouette:1091509620591313046>"),
    weight: { min: 0, max: 0 },
  }),

  new Fishy({
    id: "miso-soup",
    name: "Miso soup",
    binomialName: "Pulmenti miso",
    rarity: FishyRarities.Trash,
    description: "Not guaranteed to not be a robot",
    emoji: new TrashEmoji("🍜", "<:msSilhouette:1091509619530158170>"),
    weight: { min: 0, max: 0 },
  }),

  new Fishy({
    id: "trumpet",
    name: "A trumpet",
    binomialName: "Instrumentum tubae",
    rarity: FishyRarities.Trash,
    description: "Might sound a little wet",
    emoji: new TrashEmoji("🎺", "<:tSilhouette:1091509621820239893>"),
    weight: { min: 0, max: 0 },
  }),

  new Fishy({
    id: "ball",
    name: "A ball",
    binomialName: "Sphera canistrum",
    rarity: FishyRarities.Trash,
    description: "Probably not so good for balling anymore",
    emoji: new TrashEmoji("🏀", "<:bSilhouette:1091509616157933689>"),
    weight: { min: 0, max: 0 },
  }),
] satisfies BaseFishy[];
