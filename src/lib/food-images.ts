import espresso from "@/assets/menu-espresso.jpg";
import latte from "@/assets/menu-latte.jpg";
import icedLatte from "@/assets/menu-iced-latte.jpg";
import coldbrew from "@/assets/menu-coldbrew.jpg";
import matcha from "@/assets/menu-matcha.jpg";
import gelato from "@/assets/menu-gelato.jpg";
import sundae from "@/assets/menu-sundae.jpg";
import cake from "@/assets/menu-cake.jpg";
import croissant from "@/assets/menu-croissant.jpg";
import shake from "@/assets/menu-shake.jpg";
import cooler from "@/assets/menu-cooler.jpg";

const map: Record<string, string> = {
  espresso,
  latte,
  "iced-latte": icedLatte,
  coldbrew,
  matcha,
  gelato,
  sundae,
  cake,
  croissant,
  shake,
  cooler,
};

export function foodImage(key: string | null | undefined) {
  return map[key ?? ""] ?? latte;
}
