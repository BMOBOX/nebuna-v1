import { ReactNode } from "react";

export const metadata = {
  title: "Shadow Traders - Nebuna Inc.",
  description: "Track top institutional investors and their holdings",
};

export default function ShadowTradersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
