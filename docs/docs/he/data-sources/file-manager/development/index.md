:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פיתוח תוספים

## הרחבת סוגי קבצים ב-Frontend

עבור קבצים שהועלו, ממשק המשתמש ב-frontend יכול להציג תצוגות מקדימות שונות בהתאם לסוגי הקבצים. שדה הקבצים המצורפים של מנהל הקבצים כולל תצוגה מקדימה מובנית מבוססת דפדפן (משובצת ב-iframe), התומכת ברוב סוגי הקבצים (כגון תמונות, סרטונים, אודיו ו-PDF) לתצוגה מקדימה ישירה בדפדפן. כאשר סוג קובץ אינו נתמך לתצוגה מקדימה בדפדפן, או כאשר נדרשת אינטראקציה מיוחדת בתצוגה המקדימה, ניתן להרחיב רכיבי תצוגה מקדימה נוספים בהתבסס על סוג הקובץ.

### דוגמה

לדוגמה, אם ברצונכם להרחיב רכיב קרוסלה עבור קבצי תמונה, תוכלו להשתמש בקוד הבא:

```ts
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

`attachmentFileTypes` הוא אובייקט כניסה המסופק על ידי חבילת `@nocobase/client` להרחבת סוגי קבצים. השתמשו בשיטת `add` שלו כדי להרחיב אובייקט מתאר של סוג קובץ.

כל סוג קובץ חייב לממש שיטת `match()` כדי לבדוק אם סוג הקובץ עומד בדרישות. בדוגמה, נעשה שימוש בשיטה מחבילת `mime-match` לבדיקת מאפיין ה-`mimetype` של הקובץ. אם הוא תואם לסוג `image/*`, הוא נחשב לסוג קובץ הדורש טיפול. אם אין התאמה, המערכת תחזור לטיפול בסוג המובנה.

המאפיין `Previewer` באובייקט מתאר הסוג הוא הרכיב המשמש לתצוגה מקדימה. כאשר סוג הקובץ תואם, רכיב זה יוצג לתצוגה מקדימה. בדרך כלל מומלץ להשתמש ברכיב מסוג מודל (כמו `<Modal />`) כקונטיינר בסיסי, ולאחר מכן למקם את התצוגה המקדימה והתוכן האינטראקטיבי בתוך רכיב זה כדי לממש את פונקציונליות התצוגה המקדימה.

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` הוא מופע גלובלי, המיובא מ-`@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

רושם אובייקט מתאר חדש של סוג קובץ במרכז הרישום של סוגי הקבצים. סוג אובייקט המתאר הוא `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

שיטה להתאמת פורמט קובץ.

הפרמטר `file` הוא אובייקט נתונים של הקובץ שהועלה, המכיל מאפיינים רלוונטיים שניתן להשתמש בהם לקביעת סוג:

*   `mimetype`: תיאור ה-mimetype
*   `extname`: סיומת הקובץ, כולל הנקודה "."
*   `path`: הנתיב היחסי לאחסון הקובץ
*   `url`: כתובת ה-URL של הקובץ

ערך ההחזרה הוא מסוג `boolean`, המציין את תוצאת ההתאמה.

##### `Previewer`

רכיב React לתצוגה מקדימה של הקובץ.

פרמטרי ה-Props המועברים הם:

*   `index`: האינדקס של הקובץ ברשימת הקבצים המצורפים
*   `list`: רשימת הקבצים המצורפים
*   `onSwitchIndex`: שיטה להחלפת האינדקס

ניתן להעביר ל-`onSwitchIndex` כל ערך אינדקס מתוך ה-`list` כדי לעבור לקובץ אחר. אם משתמשים ב-`null` כפרמטר להחלפה, רכיב התצוגה המקדימה ייסגר ישירות.

```ts
onSwitchIndex(null);
```