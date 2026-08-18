import { WrappedClient } from "./WrappedClient";
import wrappedStats from "./stats.json";
import type { FunFact, WrappedStats } from "@/lib/wrapped/types";

export const metadata = {
  title: "FC2 Menu Wrapped",
  description: "A look back at what Food Court 2 served this semester - Spotify Wrapped style!",
  alternates: {
    canonical: "/wrapped",
  },
};

const FUN_FACT_TYPES = ["longest", "shortest", "weird", "repeated", "creative"] as const;

/**
 * `stats.json` is generated, and a JSON import widens every string literal in
 * it, so the fact kind arrives as a plain string. Match it back against the
 * kinds the UI knows; anything unrecognised reads as a "weird" fact, which is
 * the catch-all bucket the generator already uses.
 */
function toFunFactType(value: string): FunFact["type"] {
  return FUN_FACT_TYPES.find((candidate) => candidate === value) ?? "weird";
}

const stats: WrappedStats = {
  ...wrappedStats,
  funFacts: wrappedStats.funFacts.map((fact) => ({
    type: toFunFactType(fact.type),
    title: fact.title,
    value: fact.value,
    count: fact.count,
  })),
};

export default function WrappedPage() {
  return <WrappedClient stats={stats} />;
}
