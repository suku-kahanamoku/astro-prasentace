export const themeConfig = {
  storageKey: "prasentace-theme",
  light: {
    name: "prasentace",
    color: "#faf7ef",
  },
  dark: {
    name: "prasentace-dark",
    color: "#191d29",
  },
} as const;

export const theme = {
  color: themeConfig.light.color,
  colorScheme: "light",
} as const;
