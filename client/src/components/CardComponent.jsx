import { motion } from "framer-motion";

const SUITS = { H: "♥", D: "♦", C: "♣", S: "♠", JK: "🃏" };
const RED_SUITS = new Set(["H", "D"]);

export function FaceDownCard({ style }) {
  return (
    <div
      style={{
        width: "3rem",
        height: "4.5rem",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #1565c0 25%, #1976d2 100%)",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          width: "55%",
          height: "65%",
          border: "2px solid rgba(255,255,255,0.3)",
          borderRadius: "4px",
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

export default function CardComponent({
  card,
  selected,
  onClick,
  small,
  tiny,
}) {
  const isJoker = card.suit === "JK";
  const isRed = RED_SUITS.has(card.suit);
  const textColor = isRed ? "#d32f2f" : "#1a1a2e";

  const cardBackground = isJoker
    ? "linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)"
    : "#faf7f0";

  const selectedShadow = selected
    ? "0 0 16px rgba(245,200,66,0.6), 0 8px 20px rgba(0,0,0,0.35)"
    : "0 4px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)";

  const selectedBorder = selected ? "2px solid #f5c842" : "1px solid #d4c5a0";

  // tiny: 28×40px | small: 36×52px | normal mobile: 48×72px (scales up on md via className)
  const width = tiny ? "1.75rem" : small ? "2.25rem" : "3rem";
  const height = tiny ? "2.5rem" : small ? "3.25rem" : "4.5rem";
  const borderRadius = tiny ? "4px" : small ? "6px" : "8px";
  const topFontSize = tiny ? "6px" : small ? "8px" : "10px";
  const suitFontSize = tiny ? "5px" : small ? "7px" : "9px";
  const centerFontSize = tiny ? "12px" : small ? "16px" : "22px";
  const padding = tiny ? "2px 3px" : small ? "3px 4px" : "4px 5px";

  return (
    <motion.div
      whileHover={
        onClick ? { y: -6, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" } : {}
      }
      whileTap={onClick ? { scale: 0.95 } : {}}
      animate={{ y: selected ? -12 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      style={{
        width,
        height,
        borderRadius,
        background: cardBackground,
        border: selectedBorder,
        boxShadow: selectedShadow,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Top-left: rank + suit */}
      <div
        style={{
          color: isJoker ? "white" : textColor,
          fontSize: topFontSize,
          fontWeight: "bold",
          lineHeight: 1.2,
        }}
      >
        {isJoker ? (
          "🃏"
        ) : (
          <>
            <div>{card.rank}</div>
            <div style={{ fontSize: suitFontSize }}>{SUITS[card.suit]}</div>
          </>
        )}
      </div>

      {/* Center: large suit - hidden when tiny */}
      {!tiny && !small && (
        <div
          style={{
            color: isJoker ? "white" : textColor,
            fontSize: centerFontSize,
            lineHeight: 1,
            textAlign: "center",
            alignSelf: "center",
          }}
        >
          {SUITS[card.suit]}
        </div>
      )}

      {/* Bottom-right: rank + suit rotated */}
      <div
        style={{
          color: isJoker ? "white" : textColor,
          fontSize: topFontSize,
          fontWeight: "bold",
          lineHeight: 1.2,
          transform: "rotate(180deg)",
          alignSelf: "flex-end",
        }}
      >
        {isJoker ? (
          "🃏"
        ) : (
          <>
            <div>{card.rank}</div>
            <div style={{ fontSize: suitFontSize }}>{SUITS[card.suit]}</div>
          </>
        )}
      </div>
    </motion.div>
  );
}
