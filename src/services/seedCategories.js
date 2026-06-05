import { Category } from "../models/Category.js";

export const DEFAULT_CATEGORIES = [
  { name: "Cake", slug: "cake", image: "🎂", displayOrder: 1 },
  { name: "Pastries", slug: "pastries", image: "🥐", displayOrder: 2 },
  { name: "Ice Cream", slug: "ice-cream", image: "🍦", displayOrder: 3 },
  { name: "Bread", slug: "bread", image: "🍞", displayOrder: 4 },
  { name: "Cookies", slug: "cookies", image: "🍪", displayOrder: 5 },
  { name: "Desserts", slug: "desserts", image: "🍮", displayOrder: 6 },
  { name: "Toast", slug: "toast", image: "🥪", displayOrder: 7 },
  { name: "Sandwich", slug: "sandwich", image: "🥙", displayOrder: 8 },
  { name: "Biscuits", slug: "biscuits", image: "🧇", displayOrder: 9 },
  { name: "Namkeens", slug: "namkeens", image: "🥨", displayOrder: 10 },
  { name: "Soft Drinks", slug: "soft-drinks", image: "🥤", displayOrder: 11 },
  { name: "More Categories", slug: "more", image: "➕", displayOrder: 12 }
];

export async function seedCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate({ slug: cat.slug }, { ...cat, active: true }, { upsert: true, new: true });
  }
  // eslint-disable-next-line no-console
  console.log("Categories ready (12 bakery categories)");
}
