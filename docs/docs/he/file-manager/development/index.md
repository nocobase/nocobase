:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פיתוח הרחבות

## הרחבת מנועי אחסון

### צד השרת

1.  **ירושה מ־`StorageType`**

    צרו מחלקה חדשה ויישמו את המתודות `make()` ו־`delete()`. במידת הצורך, דִרסו (override) את ה־hooks כמו `getFileURL()`, `getFileStream()` ו־`getFileData()`.

דוגמה:

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4.  **רישום הסוג החדש**
    הטמיעו את מימוש האחסון החדש במחזור החיים `beforeLoad` או `load` של ה**תוסף**:

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

לאחר הרישום, תצורת האחסון תופיע במשאב `storages`, בדומה לסוגים המובנים. התצורה שמסופקת על ידי `StorageType.defaults()` יכולה לשמש למילוי אוטומטי של טפסים או לאתחול רשומות ברירת מחדל.

### תצורת צד הלקוח וממשק ניהול
בצד הלקוח, עליכם ליידע את מנהל הקבצים כיצד לרנדר את טופס התצורה והאם קיימת לוגיקת העלאה מותאמת אישית. כל **אובייקט** של סוג אחסון מכיל את המאפיינים הבאים:

## הרחבת סוגי קבצים בצד הלקוח

עבור קבצים שהועלו, ניתן להציג תוכן תצוגה מקדימה שונה בממשק צד הלקוח בהתבסס על סוגי קבצים שונים. שדה הקבצים המצורפים של מנהל הקבצים כולל תצוגה מקדימה מובנית של קבצים מבוססת דפדפן (המוטמעת ב־iframe), התומכת בהצגה מקדימה של רוב פורמטי הקבצים (כגון תמונות, סרטונים, אודיו וקובצי PDF) ישירות בדפדפן. כאשר פורמט קובץ אינו נתמך לתצוגה מקדימה בדפדפן, או כאשר נדרשות אינטראקציות תצוגה מקדימה מיוחדות, ניתן להרחיב את רכיב התצוגה המקדימה מבוסס סוג הקובץ.

### דוגמה

לדוגמה, אם ברצונכם להרחיב סוג קובץ תמונה עם רכיב קרוסלה (carousel) למעבר בין תמונות, תוכלו להשתמש בקוד הבא:

```tsx
import React, { useCallback } from 'react';
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

`attachmentFileTypes` הוא אובייקט הכניסה המסופק בחבילה `@nocobase/client` ומשמש להרחבת סוגי קבצים. השתמשו במתודת `add` שלו כדי להרחיב אובייקט תיאור של סוג קובץ.

כל סוג קובץ חייב לממש מתודת `match()` כדי לבדוק אם סוג הקובץ עומד בדרישות. בדוגמה, המתודה המסופקת על ידי חבילת `mime-match` משמשת לבדיקת מאפיין ה־`mimetype` של הקובץ. אם הוא תואם לסוג `image/*`, הוא נחשב לסוג הקובץ שיש לעבד. אם לא נמצאה התאמה, המערכת תחזור לטיפול המובנה בסוג הקובץ.

המאפיין `Previewer` באובייקט תיאור הסוג הוא הרכיב המשמש לתצוגה מקדימה. כאשר סוג הקובץ תואם, רכיב זה ירונדר לצורך תצוגה מקדימה. בדרך כלל מומלץ להשתמש ברכיב מסוג חלון קופץ (כמו `<Modal />` וכדומה) כקונטיינר בסיסי, ולאחר מכן למקם בתוכו את התצוגה המקדימה ואת התוכן הדורש אינטראקציה, כדי לממש את פונקציונליות התצוגה המקדימה.

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

`attachmentFileTypes` הוא מופע גלובלי, המיובא מ־`@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

רושם אובייקט תיאור סוג קובץ חדש במרכז הרישום של סוגי הקבצים. סוג אובייקט התיאור הוא `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

מתודת התאמת פורמט קובץ.

הפרמטר `file` המועבר הוא אובייקט הנתונים של קובץ שהועלה, המכיל מאפיינים רלוונטיים שניתן להשתמש בהם לבדיקת סוג:

*   `mimetype`: תיאור mimetype
*   `extname`: סיומת הקובץ, כולל הנקודה "."
*   `path`: נתיב האחסון היחסי של הקובץ
*   `url`: כתובת ה־URL של הקובץ

ערך ההחזרה הוא מסוג `boolean`, המציין את תוצאת ההתאמה.

##### `Previewer`

רכיב React המשמש לתצוגה מקדימה של קבצים.

פרמטרי ה־Props המועברים הם:

*   `index`: האינדקס של הקובץ ברשימת הקבצים המצורפים
*   `list`: רשימת הקבצים המצורפים
*   `onSwitchIndex`: מתודה למעבר בין אינדקסים

ל־`onSwitchIndex` ניתן להעביר כל ערך אינדקס מתוך הרשימה, כדי לעבור לקובץ אחר. אם `null` מועבר כארגומנט, רכיב התצוגה המקדימה ייסגר ישירות.

```ts
onSwitchIndex(null);
```