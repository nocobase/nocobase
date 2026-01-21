:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הפניות API

## צד השרת

### `BaseNotificationChannel`

זוהי מחלקה אבסטרקטית המשמשת כבסיס לסוגים שונים של ערוצי התראות. היא מגדירה את הממשקים החיוניים הנדרשים ליישום ערוץ. כדי להוסיף סוג חדש של ערוץ התראות, עליכם לרשת ממחלקה זו וליישם את המתודות שלה.

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;
}
```

### `PluginNotificationManagerServer`

תוסף זה, הפועל בצד השרת, משמש ככלי לניהול התראות. הוא מספק מתודות לרישום סוגי ערוצי התראות ולשליחת התראות.

#### `registerChannelType()`

מתודה זו רושמת סוג חדש של ערוץ בצד השרת. דוגמת שימוש מופיעה מטה.

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleSever });
  }
}

export default PluginNotificationExampleServer;
```

##### חתימה

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

מתודת `send` משמשת לשליחת התראות דרך ערוץ מוגדר.

```ts
// In-app message
send({
  channelName: 'in-app-message',
  message: {
    title: 'כותרת בדיקת הודעה בתוך האפליקציה',
    content: 'בדיקת הודעה בתוך האפליקציה'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// Email
send({
  channelName: 'email',
  message: {
    title: 'כותרת בדיקת אימייל',
    content: 'בדיקת אימייל'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@163.com', 'b@163.com']
  },
  triggerFrom: 'workflow'
});
```

##### חתימה

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

השדה `receivers` תומך כרגע בשני פורמטים: מזהי משתמש של NocoBase (`userId`) או תצורות ערוץ מותאמות אישית (`channel-self-defined`).

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### מידע מפורט

`sendConfig`

| מאפיין         | סוג         |  תיאור       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | מזהה ערוץ   |
| `message`   | `object`   | אובייקט הודעה      |
| `receivers`     | `ReceiversType`  | נמענים |
| `triggerFrom`     | `string`  | מקור ההפעלה |

## צד הלקוח

### `PluginNotificationManagerClient`

#### `channelTypes`

ספריית סוגי הערוצים הרשומים.

##### חתימה

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

רושם סוג ערוץ בצד הלקוח.

##### חתימה

`registerChannelType(params: registerTypeOptions)`

##### סוג

```ts
type registerTypeOptions = {
  title: string; // כותרת תצוגה עבור הערוץ
  type: string;  // מזהה ערוץ
  components: {
    ChannelConfigForm?: ComponentType // רכיב טופס תצורת ערוץ;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // רכיב טופס תצורת הודעה;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // רכיב טופס תצורת תוכן (עבור תוכן ההודעה בלבד, לא כולל תצורת נמענים);
  };
  meta?: { // מטא-נתונים לתצורת הערוץ
    createable?: boolean // האם ניתן להוסיף ערוצים חדשים;
    editable?: boolean  // האם תצורת הערוץ ניתנת לעריכה;
    deletable?: boolean // האם תצורת הערוץ ניתנת למחיקה;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```