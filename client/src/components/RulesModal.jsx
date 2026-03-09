import { motion, AnimatePresence } from "framer-motion";

const Section = ({ title, children }) => (
  <div className="mb-5">
    <h3
      className="text-base font-bold mb-2"
      style={{ color: "#f5c842", fontFamily: "Fredoka One, cursive" }}
    >
      {title}
    </h3>
    <div className="text-white/80 text-sm leading-relaxed space-y-1">
      {children}
    </div>
  </div>
);

const Rule = ({ children }) => (
  <p className="flex gap-2">
    <span style={{ color: "#f5c842" }}>•</span>
    <span>{children}</span>
  </p>
);

export default function RulesModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-y-auto"
            style={{
              background: "#0f3d1a",
              border: "1px solid rgba(245,200,66,0.3)",
              maxHeight: "85vh",
              direction: "rtl",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
              style={{
                background: "#0f3d1a",
                borderColor: "rgba(245,200,66,0.2)",
              }}
            >
              <h2
                className="text-2xl"
                style={{ color: "#f5c842", fontFamily: "Fredoka One, cursive" }}
              >
                חוקי יניב 🃏
              </h2>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5">
              <Section title="🎮 על המשחק">
                <p>יניב הוא משחק קלפים ישראלי ל-2 עד 4 שחקנים.</p>
                <p>המטרה: להגיע לסכום יד של 7 נקודות או פחות ולקרוא "יניב!"</p>
              </Section>

              <Section title="🃏 החפיסה">
                <p className="mb-2">54 קלפים: 52 קלפים רגילים + 2 ג'וקרים</p>
                <div className="bg-white/5 rounded-xl px-4 py-3 space-y-1">
                  <Rule>A (אס) = 1</Rule>
                  <Rule>2–10 = ערך נקוב</Rule>
                  <Rule>J, Q, K = 10</Rule>
                  <Rule>🃏 ג'וקר = 0</Rule>
                </div>
              </Section>

              <Section title="🔄 מהלך תור">
                <p className="mb-2">בכל תור השחקן חייב לבצע בסדר הבא:</p>
                <Rule>
                  השלך קודם - השלך קלף אחד או קומבינציה חוקית לערמה הפתוחה
                </Rule>
                <Rule>
                  משוך אחר כך - משוך קלף מהחפיסה הסגורה או מהערמה הפתוחה
                </Rule>
              </Section>

              <Section title="✅ קומבינציות חוקיות להשלכה">
                <Rule>קלף בודד - תמיד חוקי</Rule>
                <Rule>זוג - 2 קלפים מאותו ערך</Rule>
                <Rule>שלישייה - 3 קלפים מאותו ערך</Rule>
                <Rule>רצף - 3+ קלפים מאותו צבע ברצף (לדוגמה: 4♥ 5♥ 6♥)</Rule>
                <Rule>💡 ג'וקר יכול להחליף כל קלף בכל קומבינציה</Rule>
              </Section>

              <Section title="📣 קריאת יניב">
                <Rule>
                  ניתן לקרוא "יניב!" בתחילת התור (לפני ההשלכה) כאשר סכום היד ≤ 7
                </Rule>
                <Rule>לאחר הקריאה, כל הקלפים נחשפים</Rule>
              </Section>

              <Section title="⚠️ אסף">
                <p className="mb-2">
                  אם שחקן אחר מחזיק יד ששווה פחות או שווה לסכום הקורא:
                </p>
                <Rule>הקורא מקבל +30 נקודות עונש</Rule>
                <Rule>שאר השחקנים לא מקבלים נקודות בסיבוב זה</Rule>
                <p className="mt-2">
                  אם אין אסף - כל שאר השחקנים מקבלים לניקוד את ערך ידם.
                </p>
              </Section>

              <Section title="📊 ניקוד ובונוסים">
                <Rule>הגעה ל-50 בדיוק → ירידה ל-0 נקודות</Rule>
                <Rule>הגעה ל-100 בדיוק → ירידה ל-50 נקודות</Rule>
                <Rule>חריגה מ-100 → פסילה מהמשחק</Rule>
                <Rule>המשחק נמשך עד שנותר שחקן אחד - הוא המנצח! 🏆</Rule>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
