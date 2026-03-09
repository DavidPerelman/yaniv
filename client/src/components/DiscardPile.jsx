import CardComponent from "./CardComponent";

export default function DiscardPile({ topCard, drawableCard, onDraw, canDraw }) {
  const showBoth = drawableCard && topCard && drawableCard.id !== topCard.id;

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

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400">ערימה</span>
      <div className="relative">
        {/* Top card (most recently discarded - visual only) */}
        <CardComponent card={topCard} selected={false} onClick={undefined} />

        {/* Drawable card - shown offset if different from top */}
        {showBoth && (
          <div className="absolute -bottom-2 -right-2 opacity-80">
            <CardComponent
              card={drawableCard}
              selected={false}
              onClick={canDraw ? onDraw : undefined}
            />
          </div>
        )}
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
