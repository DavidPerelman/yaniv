import CardComponent from "./CardComponent";

export default function DrawablePicker({ cards, onPick, onCancel }) {
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-gray-800 rounded-xl shadow-xl p-3 flex flex-col items-center gap-2 min-w-max">
      <div className="flex items-center justify-between w-full gap-4">
        <span className="text-white text-sm font-semibold">בחר קלף למשיכה</span>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-row gap-2">
        {cards.map((card) => (
          <div key={card.id} className="cursor-pointer" onClick={() => onPick(card.id)}>
            <CardComponent card={card} selected={false} onClick={() => onPick(card.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
