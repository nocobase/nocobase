:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת ספק שירותי SMS

מאמר זה מסביר כיצד להרחיב את פונקציונליות ספק שירותי ה-SMS בתכונת [אימות: SMS](../sms) באמצעות תוסף.

## צד הלקוח

### רישום טופס התצורה

בעת הגדרת מאמת ה-SMS, לאחר בחירת סוג ספק שירותי ה-SMS, יופיע טופס תצורה המשויך לסוג ספק זה. טופס תצורה זה דורש רישום על ידי המפתח בצד הלקוח.

![](https://static-docs.nocobase.com/202503011221912.png)

```ts
import { Plugin, SchemaComponent } from '@nocobase/client';
import PluginVerificationClient from '@nocobase/plugin-verification/client';
import React from 'react';

const CustomSMSProviderSettingsForm: React.FC = () => {
  return <SchemaComponent schema={{
    type: 'void',
    properties: {
      accessKeyId: {
        title: `{{t("Access Key ID", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("Access Key Secret", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'TextAreaWithGlobalScope',
        'x-component-props': { password: true },
        required: true,
      },
    }
  }} />
}

class PluginCustomSMSProviderClient extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationClient;
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      components: {
        AdminSettingsForm: CustomSMSProviderSettingsForm,
      },
    });
  }
}
```

## צד השרת

### הטמעת ממשק השליחה

תוסף האימות כבר עוטף את תהליך יצירת סיסמאות חד-פעמיות דינמיות (OTPs), כך שמפתחים צריכים רק ליישם את לוגיקת השליחה כדי לתקשר עם ספק שירותי ה-SMS.

```ts
class CustomSMSProvider extends SMSProvider {
  constructor(options) {
    super(options);
    // options הוא אובייקט התצורה מצד הלקוח
    const options = this.options;
    // ...
  }

  async send(phoneNumber: string, data: { code: string }) {
    // ...
  }
}
```

### רישום סוג האימות

לאחר הטמעת ממשק השליחה, יש לרשום אותו.

```ts
import { Plugin } from '@nocobase/server';
import PluginVerificationServer from '@nocobase/plugin-verification';
import { tval } from '@nocobase/utils';

class PluginCustomSMSProviderServer extends Plugin {
  async load() {
    const plugin = this.app.pm.get('verification') as PluginVerificationServer;
    // השם חייב להתאים לזה המשמש בצד הלקוח
    plugin.smsOTPProviderManager.registerProvider('custom-sms-provider-name', {
      title: tval('Custom SMS provider', { ns: namespace }),
      provider: CustomSMSProvider,
    });
  }
}
```