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
    stat: "Dishoom sources 100K lemons every year. That's 299K Pounds.",
    nextRound: "Eve Bar",
    previousIngredientTitle: null,
    previousIngredient: null,
    mysteryIngredient: "Apricot",
    videoSrc: "/videos/dishoom.mov",
    logoSrc: null,
  },
  {
    id: 2,
    restaurant: "Eve Bar",
    stat: "Eve Bar mixes 50K cocktails every year. That's 100K ingredients.", // Placeholder
    nextRound: "Lilibet",
    previousIngredientTitle: "DISHOOM SECRET INGREDIENT",
    previousIngredient: "Apricot",
    mysteryIngredient: "Rhubarb",
    videoSrc: "/videos/eve-bar.mov",
    logoSrc: null,
  },
  {
    id: 3,
    restaurant: "Lilibet",
    stat: "Lilibet uses 20K pounds of sugar every year.", // Placeholder
    nextRound: null,
    previousIngredientTitle: "EVE BAR SECRET INGREDIENT",
    previousIngredient: "Rhubarb", // Placeholder
    mysteryIngredient: "Oyster",
    videoSrc: "/videos/lilibet.mov",
    logoSrc: null,
  }
];

export const getRoundConfig = (roundId: number): RoundConfig => {
  return ROUNDS.find(r => r.id === roundId) || ROUNDS[0];
};
