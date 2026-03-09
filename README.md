# 🃏 יניב אונליין

משחק הקלפים הישראלי הקלאסי - עכשיו אונליין עם חברים!

![יניב](https://img.shields.io/badge/משחק-יניב-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-realtime-black?style=for-the-badge&logo=socket.io)

---

## 🎮 על המשחק

יניב הוא משחק קלפים ישראלי מהנה ל-2 עד 4 שחקנים.  
המטרה: להגיע לסכום יד של **7 נקודות או פחות** ולקרוא **"יניב!"** לפני כולם.

---

## 📋 חוקי המשחק

### 🃏 החפיסה

- 54 קלפים: 52 קלפים רגילים + 2 ג'וקרים
- **ערכי קלפים:**
  | קלף | ערך |
  |-----|-----|
  | A (אס) | 1 |
  | 2–10 | ערך נקוב |
  | J, Q, K | 10 |
  | 🃏 ג'וקר | 0 |

### 🔄 מהלך תור

בכל תור השחקן **חייב** לבצע בסדר הבא:

1. **השלך קודם** - השלך קלף אחד או קומבינציה חוקית לערמה הפתוחה
2. **משוך אחר כך** - משוך קלף מהחפיסה הסגורה **או** מהערמה הפתוחה

### ✅ קומבינציות חוקיות להשלכה

| קומבינציה | תיאור                                      |
| --------- | ------------------------------------------ |
| קלף בודד  | תמיד חוקי                                  |
| זוג       | 2 קלפים מאותו ערך                          |
| שלישייה   | 3 קלפים מאותו ערך                          |
| רצף       | 3+ קלפים מאותו צבע ברצף (לדוגמה: 4♥ 5♥ 6♥) |

> 💡 **ג'וקר** יכול להחליף כל קלף בכל קומבינציה

### 📣 קריאת יניב

- ניתן לקרוא **"יניב!"** בתחילת התור (לפני ההשלכה) כאשר סכום היד ≤ 7
- לאחר הקריאה, כל הקלפים נחשפים

### ⚠️ אסף

אם שחקן אחר מחזיק יד ששווה **פחות או שווה** לסכום הקורא:

- הקורא מקבל **+30 נקודות** עונש
- שאר השחקנים לא מקבלים נקודות בסיבוב זה

אם אין אסף - כל שאר השחקנים מקבלים לניקוד את **ערך ידם**.

### 📊 ניקוד ובונוסים

| מצב              | תוצאה                |
| ---------------- | -------------------- |
| הגעה ל-50 בדיוק  | ⬇️ ירידה ל-0 נקודות  |
| הגעה ל-100 בדיוק | ⬇️ ירידה ל-50 נקודות |
| חריגה מ-100      | ❌ פסילה מהמשחק      |

המשחק נמשך עד שנותר **שחקן אחד** - הוא המנצח! 🏆

---

## 🚀 הרצה מקומית

### דרישות מקדימות

- Node.js 18+
- npm

### התקנה

```bash
# שכפל את הפרויקט
git clone https://github.com/YOUR_USERNAME/yaniv.git
cd yaniv

# התקן dependencies לשרת
cd server && npm install

# התקן dependencies לקליינט
cd ../client && npm install
```

### הרצה

```bash
# טרמינל 1 - הרץ את השרת
cd server && npm run dev

# טרמינל 2 - הרץ את הקליינט
cd client && npm run dev
```

פתח את הדפדפן בכתובת: **http://localhost:5173**

---

## 🏗️ ארכיטקטורה

```
yaniv/
├── client/          # React + Vite + TailwindCSS + Framer Motion
│   └── src/
│       ├── pages/       # Login, Lobby, Waiting, Game, End
│       ├── components/  # Card, Hand, Chat, Timer, Overlays
│       ├── hooks/       # useSocket
│       ├── socket/      # Socket.io client + events
│       └── context/     # GameContext (global state)
├── server/          # Node.js + Express + Socket.io
│   ├── game/        # deck.js, gameLogic.js, room.js
│   ├── handlers/    # roomHandlers, gameHandlers, chatHandlers
│   └── utils/       # sanitize.js, timer.js
└── shared/          # constants.js (shared between client & server)
```

**Stack:**

- **Frontend:** React 18, Vite, TailwindCSS, Framer Motion, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Real-time:** WebSocket via Socket.io
- **Deployment:** Railway (server) + Netlify (client)

---

## 🌐 Deployment

### שרת - Railway

1. צור פרויקט חדש ב-Railway
2. חבר את ה-GitHub repository
3. הגדר את ה-Root Directory ל-`server`
4. הוסף משתנה סביבה: `NODE_ENV=production`
5. Railway יזהה אוטומטית Node.js וירוץ `npm start`

### קליינט - Netlify

1. צור site חדש ב-Netlify
2. חבר את ה-GitHub repository
3. הגדר:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
4. הוסף משתנה סביבה: `VITE_SERVER_URL=https://YOUR_RAILWAY_URL`

---

## ✨ פיצ'רים

- 🎮 מולטיפלייר אמיתי בזמן אמת (2-4 שחקנים)
- 🃏 קלפים ריאליסטיים עם אנימציות
- 💬 צ'אט בין שחקנים
- ⏱️ טיימר לתור (אופציונלי: 15/30/60 שניות)
- 📱 תמיכה מלאה במובייל
- 🎉 אנימציות יניב ואסף דרמטיות
- 👑 חשיפת קלפים בסיום כל סיבוב

---

## 👨‍💻 פיתוח

הפרויקט פותח בעזרת Claude Code.

---

_בהצלחה ותנצחו! 🃏_
