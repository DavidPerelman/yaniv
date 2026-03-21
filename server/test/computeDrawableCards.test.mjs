import { strict as assert } from "assert";
import { computeDrawableCards } from "../game/gameLogic.js";

// helpers
const card = (rank, suit) => ({ id: `${suit}${rank}`, rank, suit });
const joker = (n) => ({ id: `JK${n}`, rank: "JK", suit: "JK" });
const ids = (cards) => cards.map((c) => c.id).sort();

// 1. קלף בודד
const top = card("Q", "H");
const r1 = computeDrawableCards([card("K", "S")], top);
assert.deepEqual(ids(r1), ids([top]), "1. single card");

// 2. זוג
const pair = [card("7", "H"), card("7", "D")];
const r2 = computeDrawableCards(pair, top);
assert.deepEqual(ids(r2), ids(pair), "2. pair");

// 3. שלישייה - אותו מספר, צבעים שונים
const triple = [card("7", "H"), card("7", "D"), card("7", "C")];
const r3 = computeDrawableCards(triple, top);
assert.deepEqual(ids(r3), ids(triple), "3. triple");

// 4. סרייה 3 - ג'וקר באמצע (4♥ JK 6♥)
const run4 = [card("4", "H"), joker(1), card("6", "H")];
const r4 = computeDrawableCards(run4, top);
assert.deepEqual(
  ids(r4),
  ids([card("4", "H"), card("6", "H")]),
  "4. run joker middle",
);

// 5. סרייה 3 - ג'וקר בתחתון (JK 5♥ 6♥)
const run5 = [joker(1), card("5", "H"), card("6", "H")];
const r5 = computeDrawableCards(run5, top);
assert.deepEqual(
  ids(r5),
  ids([joker(1), card("6", "H")]),
  "5. run joker bottom",
);

// 6. סרייה 4 - ג'וקר באמצע (4♥ JK 6♥ 7♥)
const run6 = [card("4", "H"), joker(1), card("6", "H"), card("7", "H")];
const r6 = computeDrawableCards(run6, top);
assert.deepEqual(
  ids(r6),
  ids([card("4", "H"), card("7", "H")]),
  "6. run4 joker middle",
);

// 7. סרייה 4 - ג'וקר בתחתון (JK 5♥ 6♥ 7♥)
const run7 = [joker(1), card("5", "H"), card("6", "H"), card("7", "H")];
const r7 = computeDrawableCards(run7, top);
assert.deepEqual(
  ids(r7),
  ids([joker(1), card("7", "H")]),
  "7. run4 joker bottom",
);

console.log("✅ כל הטסטים עברו!");
