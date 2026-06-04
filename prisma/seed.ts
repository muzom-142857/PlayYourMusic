import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const categories = [
  // 무드
  { name: "Chill", slug: "chill", emoji: "🌊", description: "Relaxed and laid-back vibes", sortOrder: 1 },
  { name: "Focus", slug: "focus", emoji: "🎯", description: "Deep concentration and productivity", sortOrder: 2 },
  { name: "Energetic", slug: "energetic", emoji: "⚡", description: "High energy and uplifting", sortOrder: 3 },
  { name: "Sad", slug: "sad", emoji: "🌧", description: "Melancholic and emotional", sortOrder: 4 },
  { name: "Happy", slug: "happy", emoji: "☀️", description: "Joyful and bright", sortOrder: 5 },
  { name: "Romantic", slug: "romantic", emoji: "🌹", description: "Love songs and tender moments", sortOrder: 6 },
  { name: "Melancholic", slug: "melancholic", emoji: "🌙", description: "Bittersweet and reflective", sortOrder: 7 },
  // 장르
  { name: "Indie", slug: "indie", emoji: "🎸", description: "Independent and alternative", sortOrder: 10 },
  { name: "Hip-Hop", slug: "hiphop", emoji: "🎤", description: "Rap and hip-hop culture", sortOrder: 11 },
  { name: "Electronic", slug: "electronic", emoji: "🎛", description: "Synths, beats, and electronic music", sortOrder: 12 },
  { name: "Jazz", slug: "jazz", emoji: "🎷", description: "Classic and contemporary jazz", sortOrder: 13 },
  { name: "Classical", slug: "classical", emoji: "🎻", description: "Orchestral and classical compositions", sortOrder: 14 },
  { name: "Pop", slug: "pop", emoji: "🎵", description: "Popular and mainstream sounds", sortOrder: 15 },
  { name: "R&B", slug: "rnb", emoji: "🎙", description: "Soul, R&B, and neo-soul", sortOrder: 16 },
  { name: "Rock", slug: "rock", emoji: "🤘", description: "Rock and alternative rock", sortOrder: 17 },
  // 상황
  { name: "Workout", slug: "workout", emoji: "💪", description: "Pump up your exercise routine", sortOrder: 20 },
  { name: "Study", slug: "study", emoji: "📚", description: "Background music for studying", sortOrder: 21 },
  { name: "Sleep", slug: "sleep", emoji: "😴", description: "Soft sounds for sleep", sortOrder: 22 },
  { name: "Party", slug: "party", emoji: "🎉", description: "Dance and party anthems", sortOrder: 23 },
  { name: "Drive", slug: "drive", emoji: "🚗", description: "Road trip and driving music", sortOrder: 24 },
  { name: "Morning", slug: "morning", emoji: "🌅", description: "Start your day right", sortOrder: 25 },
  { name: "Night", slug: "night", emoji: "🌃", description: "Late night listening", sortOrder: 26 },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.warn(`Seeded ${categories.length} categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
