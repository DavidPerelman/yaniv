import CardComponent from "./CardComponent";

function CardFan({ cards }) {
  return (
    <div
      className="relative"
      style={{ width: `${48 + (cards.length - 1) * 16}px`, height: "72px" }}
    >
      {cards.map((card, i) => (
        <div
          key={card.id}
          className="absolute"
          style={{ left: `${i * 16}px`, top: 0 }}
        >
          <CardComponent card={card} selected={false} onClick={undefined} />
        </div>
      ))}
    </div>
  );
}

export default function DiscardPile({ topCard, drawableCard, underCard, onDraw, canDraw, fanCards = [] }) {
  const showBoth = drawableCard && topCard && drawableCard.id !== topCard.id;
  const showFan = fanCards.length > 1;

  if (!topCard) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-400">ערימה</span>
        <div className="w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-500 text-xs">
          ריק
        </div>
      </div>
    );
  }

  // Fan display (purely visual) when multiple cards were last discarded
  if (showFan) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-400">ערימה</span>
        <div className="flex items-center gap-2">
          {underCard && (
            <CardComponent
              card={underCard}
              selected={false}
              onClick={canDraw ? onDraw : undefined}
            />
          )}
          <div className={underCard ? "opacity-50" : ""}>
            <CardFan cards={fanCards} />
          </div>
        </div>
        {!showBoth && drawableCard && (
          <button
            onClick={canDraw ? onDraw : undefined}
            disabled={!canDraw}
            className="text-xs text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed hover:text-blue-200 transition"
          >
            משוך
          </button>
        )}
      </div>
    );
  }

  // Single card — existing behavior unchanged
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400">ערימה</span>
      <div className="relative">
        {/* Draw phase: drawable card in normal flow, topCard floats on top semi-transparent */}
        {showBoth && (
          <CardComponent
            card={drawableCard}
            selected={false}
            onClick={canDraw ? onDraw : undefined}
          />
        )}
        {/* Draw phase with underCard: underCard in normal flow, topCard floats on top */}
        {!showBoth && underCard && (
          <CardComponent
            card={underCard}
            selected={false}
            onClick={canDraw ? onDraw : undefined}
          />
        )}
        {/* topCard — overlay when stacking, or sole card when alone */}
        <div className={showBoth || underCard ? "absolute -bottom-2 -right-2 opacity-80 pointer-events-none" : ""}>
          <CardComponent
            card={topCard}
            selected={false}
            onClick={!showBoth && !underCard && canDraw ? onDraw : undefined}
          />
        </div>
      </div>

      {/* If same card (first turn), show draw button */}
      {!showBoth && drawableCard && (
        <button
          onClick={canDraw ? onDraw : undefined}
          disabled={!canDraw}
          className="text-xs text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed hover:text-blue-200 transition"
        >
          משוך
        </button>
      )}
    </div>
  );
}
