import burger from "@/assets/food-burger.jpg";
import chicken from "@/assets/food-chicken.jpg";
import meal from "@/assets/food-meal.jpg";
import sandwich from "@/assets/food-sandwich.jpg";
import fries from "@/assets/food-fries.jpg";
import drink from "@/assets/food-drink.jpg";
import dessert from "@/assets/food-dessert.jpg";
import kids from "@/assets/food-kids.jpg";

const map: Record<string, string> = {
  burger,
  chicken,
  meal,
  sandwich,
  fries,
  drink,
  dessert,
  kids,
};

export function foodImage(key: string | null | undefined) {
  return map[key ?? ""] ?? burger;
}
