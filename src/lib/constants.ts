export const constants = {
  defaultTasteAmount: 1000,
  hardPageLimit: 100,
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