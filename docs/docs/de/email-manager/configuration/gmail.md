---
pkg: "@nocobase/plugin-email-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Google-Konfiguration

### Voraussetzungen

Damit Benutzer ihre Google Mail-Konten später mit NocoBase verbinden können, muss NocoBase auf einem Server bereitgestellt werden, der Zugriff auf Google-Dienste hat. Das Backend wird die Google API aufrufen.
    
### Konto registrieren

1. Öffnen Sie https://console.cloud.google.com/welcome, um zu Google Cloud zu gelangen.
2. Beim ersten Besuch müssen Sie den Nutzungsbedingungen zustimmen.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### App erstellen

1. Klicken Sie oben auf "Select a project".
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Klicken Sie im Pop-up-Fenster auf die Schaltfläche "NEW PROJECT".

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Füllen Sie die Projektinformationen aus.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Nachdem das Projekt erstellt wurde, wählen Sie es aus.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Gmail API aktivieren

1. Klicken Sie auf die Schaltfläche "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Wechseln Sie zum Dashboard "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Suchen Sie nach "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Klicken Sie auf die Schaltfläche "ENABLE", um die Gmail API zu aktivieren.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### OAuth-Zustimmungsbildschirm konfigurieren

1. Klicken Sie links auf das Menü "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Wählen Sie "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Füllen Sie die Projektinformationen aus (diese werden später auf der Autorisierungsseite angezeigt) und klicken Sie auf Speichern.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Füllen Sie die "Developer contact information" aus und klicken Sie auf Weiter.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Klicken Sie auf Weiter.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Fügen Sie Testbenutzer hinzu, um die App vor der Veröffentlichung zu testen.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Klicken Sie auf Weiter.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Überprüfen Sie die Übersichtsinformationen und kehren Sie zum Dashboard zurück.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Anmeldeinformationen (Credentials) erstellen

1. Klicken Sie links auf das Menü "Credentials".

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Klicken Sie auf die Schaltfläche "CREATE CREDENTIALS" und wählen Sie "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Wählen Sie "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Füllen Sie die Anwendungsinformationen aus.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Geben Sie die endgültige Bereitstellungsdomäne des Projekts ein (das hier gezeigte Beispiel ist eine NocoBase-Testadresse).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Fügen Sie die autorisierte Weiterleitungs-URI hinzu. Sie muss `Domäne + "/admin/settings/mail/oauth2"` lauten. Beispiel: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Klicken Sie auf Erstellen, um die OAuth-Informationen anzuzeigen.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Kopieren Sie die Client-ID und das Client-Geheimnis und fügen Sie diese auf der E-Mail-Konfigurationsseite ein.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Klicken Sie auf Speichern, um die Konfiguration abzuschließen.

### App veröffentlichen

Nachdem der oben beschriebene Prozess abgeschlossen und Funktionen wie die Autorisierung von Testbenutzern und der E-Mail-Versand getestet wurden, können Sie die App veröffentlichen.

1. Klicken Sie auf das Menü "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Klicken Sie auf die Schaltfläche "EDIT APP" und anschließend unten auf die Schaltfläche "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Klicken Sie auf die Schaltfläche "ADD OR REMOVE SCOPES", um die Benutzerberechtigungsbereiche auszuwählen.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Suchen Sie nach "Gmail API" und aktivieren Sie dann "Gmail API" (vergewissern Sie sich, dass der Scope-Wert die Gmail API mit "https://mail.google.com/" ist).

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Klicken Sie unten auf die Schaltfläche "UPDATE", um zu speichern.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Klicken Sie unten auf jeder Seite auf die Schaltfläche "SAVE AND CONTINUE" und schließlich auf die Schaltfläche "BACK TO DASHBOARD", um zur Dashboard-Seite zurückzukehren.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Klicken Sie auf die Schaltfläche "PUBLISH APP". Es erscheint eine Bestätigungsseite, auf der die für die Veröffentlichung erforderlichen Informationen aufgeführt sind. Klicken Sie anschließend auf die Schaltfläche "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Kehren Sie zur Konsolenseite zurück. Dort sehen Sie, dass der Veröffentlichungsstatus "In production" ist.

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Klicken Sie auf die Schaltfläche "PREPARE FOR VERIFICATION", füllen Sie die erforderlichen Informationen aus und klicken Sie auf die Schaltfläche "SAVE AND CONTINUE" (die Daten im Bild dienen nur als Beispiel).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Füllen Sie die weiteren notwendigen Informationen aus (die Daten im Bild dienen nur als Beispiel).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Klicken Sie auf die Schaltfläche "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Klicken Sie auf die Schaltfläche "SUBMIT FOR VERIFICATION", um die Verifizierung einzureichen.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Warten Sie auf das Genehmigungsergebnis.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Solange die Genehmigung noch aussteht, können Benutzer auf den unsicheren Link klicken, um sich zu autorisieren und anzumelden.

![](https://static-docs.nocobase.com/mail-1735633689645.png)