:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פיתוח הרחבות

## הרחבת מנועי אחסון

### צד שרת

1. **ירושה מ-`StorageType`**
   
   צרו מחלקה חדשה והטמיעו את המתודות `make()` ו-`delete()`. במידת הצורך דרסו hooks כמו `getFileURL()`, `getFileStream()` ו-`getFileData()`.

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

4. **רישום סוג חדש**  
   הזריקו את מימוש האחסון החדש למחזור החיים `beforeLoad` או `load` של התוסף:

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

לאחר הרישום, תצורת האחסון תופיע במשאב `storages` כמו הסוגים המובנים. את התצורה שמספק `StorageType.defaults()` ניתן להשתמש למילוי אוטומטי של טפסים או לאתחול רשומות ברירת מחדל.

<!--
### תצורת צד לקוח וממשק ניהול
בצד הלקוח צריך להודיע למנהל הקבצים כיצד לרנדר את טופס התצורה והאם יש לוגיקת העלאה מותאמת אישית. לכל אובייקט מסוג אחסון יש את המאפיינים הבאים:
-->

## הרחבת סוגי קבצים בצד ה-Frontend

עבור קבצים שהועלו, ניתן להציג תצוגות מקדימות שונות בממשק לפי סוג הקובץ. לשדה הקבצים של מנהל הקבצים יש תצוגה מקדימה מובנית המבוססת דפדפן (מוטמעת ב-iframe), התומכת ברוב הפורמטים (כמו תמונות, וידאו, אודיו ו-PDF) ישירות בדפדפן. כאשר פורמט הקובץ אינו נתמך בדפדפן או נדרשות אינטראקציות תצוגה מיוחדות, ניתן להרחיב את רכיב התצוגה לפי סוג הקובץ.

### דוגמה

לדוגמה, אם רוצים לשלב תצוגה מקדימה מקוונת מותאמת אישית לקבצי Office, ניתן להשתמש בקוד הבא:

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

כאן `filePreviewTypes` הוא אובייקט הכניסה שמספק `@nocobase/plugin-file-manager/client` להרחבת תצוגות מקדימות. השתמשו ב-`add` כדי להוסיף אובייקט תיאור של סוג קובץ.

כל סוג קובץ חייב לממש מתודת `match()` כדי לבדוק אם הסוג עומד בדרישות. בדוגמה משתמשים ב-`matchMimetype` כדי לבדוק את מאפיין `mimetype` של הקובץ. אם הוא תואם לסוג `docx`, הוא נחשב לסוג שיש לטפל בו. אם אין התאמה, תתבצע חזרה לטיפול המובנה.

מאפיין `Previewer` באובייקט התיאור הוא הרכיב שמבצע את התצוגה המקדימה. כאשר הסוג תואם, רכיב זה יוצג בדיאלוג התצוגה. ניתן להחזיר כל תצוגת React (כגון iframe, נגן או תרשים).

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` הוא מופע גלובלי המיובא מ-`@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

רישום אובייקט תיאור חדש של סוג קובץ ברג'יסטרי של סוגי קבצים. סוג האובייקט הוא `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

שיטה להתאמת פורמט קובץ.

פרמטר הקלט `file` הוא אובייקט הנתונים של הקובץ שהועלה, וכולל מאפיינים רלוונטיים לבדיקת סוג:

* `mimetype`: תיאור mimetype
* `extname`: סיומת הקובץ, כולל "."
* `path`: נתיב האחסון היחסי של הקובץ
* `url`: כתובת ה-URL של הקובץ

מחזירה ערך `boolean` שמציין אם יש התאמה.

##### `getThumbnailURL`

מחזירה את כתובת ה-URL של התמונה הממוזערת ברשימת הקבצים. אם הערך מוחזר ריק, תשתמש בתמונת placeholder מובנית.

##### `Previewer`

רכיב React לתצוגה מקדימה של קבצים.

ה-Props הנכנסים הם:

* `file`: אובייקט הקובץ הנוכחי (יכול להיות URL כמחרוזת או אובייקט הכולל `url`/`preview`)
* `index`: אינדקס הקובץ ברשימה
* `list`: רשימת הקבצים

