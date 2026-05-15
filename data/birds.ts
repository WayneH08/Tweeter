export type Bird = {
  id: string;
  commonName: string;
  scientificName: string;
  region: string;
  habitat: string;
  size: string;
  diet: string;
  callLabel: string;
  funFact: string;
  description: string;
  imageUrl: string;
  audioUrl?: string | null;
  tags: string[];
};

export type BirdRow = {
  id: string;
  common_name: string;
  scientific_name: string | null;
  region: string | null;
  habitat: string | null;
  size: string | null;
  diet: string | null;
  call_description: string | null;
  fun_fact: string | null;
  description: string | null;
  image_url: string | null;
  audio_url: string | null;
  tags: string[] | null;
  created_at?: string;
};

export function mapBirdRowToBird(row: BirdRow): Bird {
  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name || "Unknown scientific name",
    region: row.region || "Unknown region",
    habitat: row.habitat || "Unknown habitat",
    size: row.size || "Unknown size",
    diet: row.diet || "Unknown diet",
    callLabel: row.call_description || "No call information yet",
    funFact: row.fun_fact || "No fun fact yet.",
    description: row.description || "No description yet.",
    imageUrl:
      row.image_url ||
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3?q=80&w=1200&auto=format&fit=crop",
    audioUrl: row.audio_url,
    tags: row.tags || [],
  };
}

export const PLACEHOLDER_BIRDS: Bird[] = [
  {
    id: "northern-cardinal",
    commonName: "Northern Cardinal",
    scientificName: "Cardinalis cardinalis",
    region: "Eastern and Central North America",
    habitat: "Woodlands, backyards, parks, and shrublands",
    size: "Medium songbird",
    diet: "Seeds, fruits, insects, and berries",
    callLabel: "Clear whistles and sharp chip notes",
    funFact:
      "Male cardinals are bright red, while females are warm brown with reddish accents.",
    description:
      "Northern Cardinals are one of the most recognizable backyard birds in North America. They are often seen perched in shrubs, singing from trees, or visiting feeders. Their bright color and loud song make them a favorite for beginner birdwatchers.",
    imageUrl:
      "https://images.unsplash.com/photo-1606567595334-d39972c85dbe?q=80&w=1200&auto=format&fit=crop",
    audioUrl: null,
    tags: ["Backyard", "Songbird", "Red", "Common"],
  },
  {
    id: "blue-jay",
    commonName: "Blue Jay",
    scientificName: "Cyanocitta cristata",
    region: "Eastern and Central North America",
    habitat: "Forests, parks, neighborhoods, and oak woodlands",
    size: "Medium-large songbird",
    diet: "Acorns, seeds, insects, and occasionally eggs",
    callLabel: "Loud jeers, whistles, and mimicry",
    funFact:
      "Blue Jays are intelligent corvids and can mimic the calls of hawks.",
    description:
      "Blue Jays are bold, loud, and highly intelligent birds. They often travel in family groups and are known for their strong calls. They are part of the corvid family, which also includes crows and ravens.",
    imageUrl:
      "https://images.unsplash.com/photo-1618611157876-3517929c6288?q=80&w=1200&auto=format&fit=crop",
    audioUrl: null,
    tags: ["Corvid", "Blue", "Loud", "Backyard"],
  },
  {
    id: "american-robin",
    commonName: "American Robin",
    scientificName: "Turdus migratorius",
    region: "North America",
    habitat: "Lawns, gardens, forests, parks, and open areas",
    size: "Medium songbird",
    diet: "Worms, insects, and berries",
    callLabel: "Cheerful phrases and sharp alarm calls",
    funFact: "Robins are often seen pulling earthworms from lawns after rain.",
    description:
      "American Robins are common birds with orange-red breasts and gray-brown backs. They are often seen hopping across lawns while searching for worms and insects. Their song is one of the classic sounds of spring.",
    imageUrl:
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3?q=80&w=1200&auto=format&fit=crop",
    audioUrl: null,
    tags: ["Common", "Orange Breast", "Songbird", "Lawn"],
  },
];
