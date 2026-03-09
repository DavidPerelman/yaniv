import {
  createDeck,
  calculateHandValue,
  getCardValue,
  RANK_ORDER,
} from "./deck.js";
import { GAME_CONSTANTS } from "../../shared/constants.js";

export function createInitialGameState(players, settings) {
  const deck = createDeck();

  const statePlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    hand: [],
    score: 0,
    isEliminated: false,
  }));

  // Deal 5 cards to each player
  for (let i = 0; i < 5; i++) {
    for (const player of statePlayers) {
      player.hand.push(deck.pop());
    }
  }

  // Start discard pile with 1 card
  const discardPile = [deck.pop()];

  return {
    deck,
    discardPile,
    drawableDiscardCard: discardPile[0] ?? null,
    // The card a player may draw from the discard pile this turn.
    // Set to the top card after each discard action.
    players: statePlayers,
    currentPlayerIndex: 0,
    phase: "discard",
    roundNumber: 1,
    settings,
    winner: null,
  };
}

export function isValidDiscard(cards) {
  if (!cards || cards.length === 0) return false;
  if (cards.length === 1) return true;

  const jokers = cards.filter((c) => c.suit === "JK");
  const nonJokers = cards.filter((c) => c.suit !== "JK");

  // All jokers - valid as a set
  if (nonJokers.length === 0) return true;

  // --- Try as a set (pair / three-of-a-kind / four-of-a-kind: 2–4 cards) ---
  if (cards.length <= 4) {
    const firstRank = nonJokers[0].rank;
    const allSameRank = nonJokers.every((c) => c.rank === firstRank);
    if (allSameRank) return true;
  }

  // --- Try as a run (3+ cards, same suit, consecutive ranks) ---
  if (cards.length >= 3) {
    const firstSuit = nonJokers[0].suit;
    const allSameSuit = nonJokers.every((c) => c.suit === firstSuit);
    if (!allSameSuit) return false;

    const rankValues = nonJokers.map((c) => RANK_ORDER.indexOf(c.rank) + 1);

    // Duplicate ranks among non-jokers → invalid
    const unique = new Set(rankValues);
    if (unique.size !== nonJokers.length) return false;

    rankValues.sort((a, b) => a - b);
    const min = rankValues[0];
    const max = rankValues[rankValues.length - 1];
    const span = max - min + 1;

    // Jokers fill internal gaps and/or extend at ends
    // span ≤ cards.length guarantees enough jokers for all gaps
    if (span <= cards.length) return true;
  }

  return false;
}

export function applyDiscard(gameState, playerId, cards) {
  const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { success: false, error: "Player not found" };
  if (playerIndex !== gameState.currentPlayerIndex)
    return { success: false, error: "Not your turn" };
  if (gameState.phase !== "discard")
    return { success: false, error: "Not the discard phase" };

  if (!isValidDiscard(cards))
    return { success: false, error: "Invalid discard combination" };

  const cardIds = new Set(cards.map((c) => c.id));
  const player = gameState.players[playerIndex];
  const handCardIds = new Set(player.hand.map((c) => c.id));
  for (const id of cardIds) {
    if (!handCardIds.has(id))
      return { success: false, error: "Card not in hand" };
  }

  const topBeforeDiscard = gameState.discardPile.at(-1) ?? null;

  const newHand = player.hand.filter((c) => !cardIds.has(c.id));
  const newDiscardPile = [...gameState.discardPile, ...cards];

  const newState = {
    ...gameState,
    phase: "draw",
    discardPile: newDiscardPile,
    drawableDiscardCard: topBeforeDiscard,
    players: gameState.players.map((p, i) =>
      i === playerIndex ? { ...p, hand: newHand } : p,
    ),
  };

  return { success: true, gameState: newState };
}

export function applyDraw(gameState, playerId, source) {
  const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { success: false, error: "Player not found" };
  if (playerIndex !== gameState.currentPlayerIndex)
    return { success: false, error: "Not your turn" };
  if (gameState.phase !== "draw")
    return { success: false, error: "Not the draw phase" };

  let deck = [...gameState.deck];
  let discardPile = [...gameState.discardPile];
  let drawnCard;

  if (source === "deck") {
    // Reshuffle discard pile (except top card) into deck if needed
    if (deck.length === 0) {
      if (discardPile.length <= 1)
        return { success: false, error: "No cards left to draw" };
      const topCard = discardPile[discardPile.length - 1];
      const toShuffle = discardPile.slice(0, discardPile.length - 1);
      for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
      }
      deck = toShuffle;
      discardPile = [topCard];
    }
    drawnCard = deck.pop();
  } else if (source === "discard") {
    const cardToTake = gameState.drawableDiscardCard;
    if (!cardToTake) return { success: false, error: "אין קלף זמין בערמה" };
    discardPile = discardPile.filter((c) => c.id !== cardToTake.id);
    drawnCard = cardToTake;
  } else {
    return { success: false, error: "Invalid source" };
  }

  const nextIndex = getNextActivePlayerIndex(
    gameState.players,
    gameState.currentPlayerIndex,
  );

  const newState = {
    ...gameState,
    deck,
    discardPile,
    drawableDiscardCard: null,
    phase: "discard",
    currentPlayerIndex: nextIndex,
    players: gameState.players.map((p, i) =>
      i === playerIndex ? { ...p, hand: [...p.hand, drawnCard] } : p,
    ),
  };

  return { success: true, gameState: newState, drawnCard };
}

export function canCallYaniv(hand) {
  return calculateHandValue(hand) <= GAME_CONSTANTS.YANIV_THRESHOLD;
}

export function applyYaniv(gameState, callerId) {
  const caller = gameState.players.find((p) => p.id === callerId);
  if (!caller) return { success: false, error: "Player not found" };
  if (!canCallYaniv(caller.hand))
    return { success: false, error: "Hand value too high to call Yaniv" };

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const callerHandValue = calculateHandValue(caller.hand);

  // Check for assaf: any OTHER active player with handValue ≤ caller's
  const callerWasAssafed = activePlayers.some(
    (p) => p.id !== callerId && calculateHandValue(p.hand) <= callerHandValue,
  );

  let assaferId = null;
  let assaferName = null;
  if (callerWasAssafed) {
    const assafer = activePlayers.find(
      (p) => p.id !== callerId && calculateHandValue(p.hand) <= callerHandValue,
    );
    if (assafer) {
      assaferId = assafer.id;
      assaferName = assafer.name;
    }
  }

  const playerResults = [];
  const updatedPlayers = gameState.players.map((p) => {
    if (p.isEliminated) {
      playerResults.push({
        id: p.id,
        name: p.name,
        handValue: null,
        scoreDelta: 0,
        newScore: p.score,
        bonusApplied: null,
        eliminated: true,
      });
      return p;
    }

    const handValue = calculateHandValue(p.hand);
    let scoreDelta = 0;

    if (callerWasAssafed) {
      // Only caller is penalized
      if (p.id === callerId) scoreDelta = GAME_CONSTANTS.YANIV_PENALTY;
    } else {
      // Caller wins - other players score their hand value
      if (p.id !== callerId) scoreDelta = handValue;
    }

    let newScore = p.score + scoreDelta;
    let bonusApplied = null;
    let eliminated = p.isEliminated;

    if (scoreDelta > 0 || (callerWasAssafed && p.id === callerId)) {
      if (newScore === GAME_CONSTANTS.BONUS_50) {
        newScore = 0;
        bonusApplied = "reset_50";
      } else if (newScore === GAME_CONSTANTS.BONUS_100) {
        newScore = 50;
        bonusApplied = "reset_100";
      } else if (newScore > GAME_CONSTANTS.SCORE_LIMIT) {
        eliminated = true;
        bonusApplied = null;
      }
    }

    playerResults.push({
      id: p.id,
      name: p.name,
      hand: p.hand,
      handValue,
      scoreDelta,
      newScore,
      bonusApplied,
      eliminated,
    });
    return { ...p, score: newScore, isEliminated: eliminated };
  });

  // Check for winner: only 1 non-eliminated player remaining
  const remaining = updatedPlayers.filter((p) => !p.isEliminated);
  let winner = gameState.winner;
  if (remaining.length === 1) {
    winner = remaining[0];
  } else if (remaining.length === 0) {
    // Edge case: everyone eliminated simultaneously — lowest score wins
    const lowestScore = Math.min(...updatedPlayers.map((p) => p.score));
    winner = updatedPlayers.find((p) => p.score === lowestScore);
  }

  const newState = {
    ...gameState,
    players: updatedPlayers,
    winner,
  };

  return {
    success: true,
    gameState: newState,
    roundResult: {
      callerId,
      callerName: caller.name,
      callerWasAssafed,
      assaferId,
      assaferName,
      playerResults,
    },
  };
}

export function getNextActivePlayerIndex(players, currentIndex) {
  const total = players.length;
  for (let i = 1; i <= total; i++) {
    const idx = (currentIndex + i) % total;
    if (!players[idx].isEliminated) return idx;
  }
  return currentIndex; // fallback: all eliminated (shouldn't happen)
}

/* TESTS
 * createInitialGameState:
 *   - Each player receives exactly 5 cards
 *   - Discard pile starts with exactly 1 card
 *   - Deck size is 54 - 5*numPlayers - 1
 *   - phase is 'discard', currentPlayerIndex is 0, roundNumber is 1
 *   - All player scores start at 0, isEliminated at false
 *   - Settings are stored on gameState
 *
 * isValidDiscard:
 *   - Single card returns true
 *   - Pair of same rank returns true
 *   - Two different ranks (no joker) returns false
 *   - Pair with one joker returns true
 *   - Two jokers returns true
 *   - Three of a kind returns true
 *   - Run of 3 consecutive same suit returns true
 *   - Run of 3 same suit with a gap + joker returns true
 *   - Run with cards of different suits returns false
 *   - Run with duplicate ranks among non-jokers returns false
 *   - 4-card run returns true
 *   - Two cards of different ranks with no joker returns false
 *
 * applyDiscard:
 *   - Returns error if not player's turn
 *   - Returns error if phase is not 'discard'
 *   - Returns error if discard combination is invalid
 *   - Returns error if card not in player's hand
 *   - On success: cards removed from hand, added to discard pile, phase becomes 'draw'
 *
 * applyDraw:
 *   - Returns error if not player's turn
 *   - Returns error if phase is not 'draw'
 *   - Drawing from deck adds top deck card to hand
 *   - Drawing from discard removes top discard card and adds to hand
 *   - When deck is empty and source is 'deck': discard pile (except top) is reshuffled into deck
 *   - After draw: phase becomes 'discard', currentPlayerIndex advances to next active player
 *   - Skips eliminated players when advancing turn
 *
 * canCallYaniv:
 *   - Hand value exactly 7 returns true
 *   - Hand value 6 returns true
 *   - Hand value 8 returns false
 *   - Empty hand returns true
 *
 * applyYaniv:
 *   - Returns error if caller's hand value > 7
 *   - Normal win: other players' hand values added to their scores
 *   - Assaf: caller's score increases by 30, other players do not score
 *   - Score exactly 50 resets to 0
 *   - Score exactly 100 resets to 50
 *   - Score > 100 marks player as eliminated
 *   - When only 1 player remains, winner is set
 *
 * getNextActivePlayerIndex:
 *   - Returns the next non-eliminated player index
 *   - Wraps around from last player to first
 *   - Skips eliminated players correctly
 */
