export interface RoundConfig {
  id: number;
  restaurant: string;
  stat: string;
  nextRound: string | null;
  previousIngredientTitle: string | null;
  previousIngredient: string | null;
  mysteryIngredient: string;
  videoSrc: string; // Placeholder for video background path
  logoSrc: string | null; // Placeholder for restaurant logo if any
}

export const ROUNDS: RoundConfig[] = [
  {
    id: 1,
    restaurant: "Dishoom",
    stat: "Dishoom uses 54,000 eggs and 5,400 kg of bacon to create their iconic Bacon Naan Rolls each year. ",
    nextRound: "Eve Bar",
    previousIngredientTitle: null,
    previousIngredient: null,
    mysteryIngredient: "Apricot",
    videoSrc: "/videos/dishoom.mov",
    logoSrc: "/dishoom.png",
  },
  {
    id: 2,
    restaurant: "Eve Bar",
    stat: "Adam Handling turned the 20% that used to go in the bin into 10,000 cocktails a year.", // Placeholder
    nextRound: "Lilibet",
    previousIngredientTitle: "DISHOOM SECRET INGREDIENT",
    previousIngredient: "Apricot",
    mysteryIngredient: "Rhubarb",
    videoSrc: "/videos/eve-bar.mov",
    logoSrc: "/evebar.svg",
  },
  {
    id: 3,
    restaurant: "Lilibet",
    stat: "Lilibet's shucked 31,000 oysters in their first year, served from the same Mayfair address where Queen Elizabeth II was born.", // Placeholder
    nextRound: null,
    previousIngredientTitle: "EVE BAR SECRET INGREDIENT",
    previousIngredient: "Rhubarb", // Placeholder
    mysteryIngredient: "Oyster",
    videoSrc: "/videos/lilibet.mp4",
    logoSrc: "/lilibets.svg",
  },
];

export const getRoundConfig = (roundId: number): RoundConfig => {
  return ROUNDS.find((r) => r.id === roundId) || ROUNDS[0];
};
