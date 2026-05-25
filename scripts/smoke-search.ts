import { searchKnowledge } from "../lib/search";

async function main() {
  const queries = [
    "coffee during fasting",
    "berberine",
    "walking after meals",
    "artificial sweeteners",
  ];

  for (const query of queries) {
    const results = await searchKnowledge(query, 5);
    console.log(`\n${query}`);
    for (const result of results) {
      console.log(`  [${result.entity_type}] ${result.title} (score ${result.score.toFixed(2)})`);
    }
    if (results.length === 0) console.log("  (no results)");
  }
}

main();
