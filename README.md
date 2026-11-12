# OhadCad

תכנון לוחות חשמל ותרשימים חד-קוויים — אפליקציה עצמאית (PWA).

- `index.html` — כניסה עם Google, אישור משתמשים ע״י הבעלים, והתיקייה המשותפת (Firestore).
- `cad.html` — כלי השרטוט עצמו.
- `firestore.rules` — כללי האבטחה; מפרסמים אותם ב-Firebase Console ← Firestore ← Rules.
- `archive/` — האפליקציה הקודמת "אינדקס תוכניות חשמל G-WWTP", לקריאה בלבד.

הגדרה חד-פעמית ב-Firebase Console (פרויקט `ogg-electrical-plans-81c33`):
1. Authentication ← Sign-in method ← Google ← הפעלה.
2. Authentication ← Settings ← Authorized domains ← הוספת `ohadavraham85.github.io`.
3. Firestore Database ← Rules ← הדבקת `firestore.rules` ← Publish.
