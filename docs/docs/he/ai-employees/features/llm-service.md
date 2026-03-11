:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/ai-employees/features/llm-service).
:::

# הגדרת שירות LLM

לפני השימוש ב-AI Employees (עובדי AI), יש להגדיר תחילה את שירותי ה-LLM הזמינים.

נכון לעכשיו נתמכים OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, וכן מודלים מקומיים של Ollama.

## יצירת שירות חדש

עברו אל `System Settings -> AI Employees -> LLM service`.

1. לחצו על `Add New` כדי לפתוח את חלון היצירה.
2. בחרו `Provider` (ספק).
3. מלאו את השדות `Title`, `API Key`, ו-`Base URL` (אופציונלי).
4. הגדירו את ה-`Enabled Models` (מודלים מופעלים):
   - `Recommended models`: שימוש במודלים המומלצים רשמית.
   - `Select models`: בחירה מתוך רשימת המודלים המוחזרת מהספק.
   - `Manual input`: הזנה ידנית של מזהה המודל (ID) ושם התצוגה.
5. לחצו על `Submit` לשמירה.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## הפעלה וסידור שירותים

ברשימת שירותי ה-LLM ניתן לבצע את הפעולות הבאות:

- שימוש במתג `Enabled` להפעלה או השבתה של שירותים.
- גרירה לשינוי סדר השירותים (משפיע על סדר הצגת המודלים).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## בדיקת זמינות

השתמשו ב-`Test flight` בתחתית חלון הגדרות השירות כדי לבדוק את זמינות השירות והמודלים.

מומלץ לבצע בדיקה זו לפני השימוש בפעילות העסקית.