---
pkg: "@nocobase/plugin-email-manager"
---

# Google Configuration

### Prerequisites

For users to connect their Google Mail accounts to NocoBase, it must be deployed on a server that can access Google services, as the backend will call the Google API.
    
### Register an Account

1. Open https://console.cloud.google.com/welcome to go to Google Cloud.
2. You will need to agree to the terms and conditions on your first visit.
    

![](https://static-docs.nocobase.com/mail-1733818617807.png)


### Create an App

1. Click "Select a project" at the top.
    

![](https://static-docs.nocobase.com/mail-1733818618126.png)


2. Click the "NEW PROJECT" button in the pop-up.


![](https://static-docs.nocobase.com/mail-1733818618329.png)


3. Fill in the project information.
    

![](https://static-docs.nocobase.com/mail-1733818618510.png)


4. After the project is created, select it.


![](https://static-docs.nocobase.com/mail-1733818618828.png)



![](https://static-docs.nocobase.com/mail-1733818619044.png)


### Enable the Gmail API

1. Click the "APIs & Services" button.


![](https://static-docs.nocobase.com/mail-1733818619230.png)


2. Go to the APIs & Services dashboard.


![](https://static-docs.nocobase.com/mail-1733818619419.png)


3. Search for "mail".


![](https://static-docs.nocobase.com/mail-1733818619810.png)



![](https://static-docs.nocobase.com/mail-1733818620020.png)


4. Click the "ENABLE" button to enable the Gmail API.


![](https://static-docs.nocobase.com/mail-1733818620589.png)



![](https://static-docs.nocobase.com/mail-1733818620885.png)


### Configure OAuth consent screen

1. Click the "OAuth consent screen" menu on the left.


![](https://static-docs.nocobase.com/mail-1733818621104.png)


2. Select "External".


![](https://static-docs.nocobase.com/mail-1733818621322.png)


3. Fill in the project information (this will be displayed on the authorization page) and click save.


![](https://static-docs.nocobase.com/mail-1733818621538.png)


4. Fill in the Developer contact information and click continue.


![](https://static-docs.nocobase.com/mail-1733818621749.png)


5. Click continue.


![](https://static-docs.nocobase.com/mail-1733818622121.png)


6. Add test users for testing before the app is published.


![](https://static-docs.nocobase.com/mail-1733818622332.png)



![](https://static-docs.nocobase.com/mail-1733818622537.png)


7. Click continue.


![](https://static-docs.nocobase.com/mail-1733818622753.png)


8. Review the summary information and return to the dashboard.


![](https://static-docs.nocobase.com/mail-1733818622984.png)


### Create Credentials

1. Click the "Credentials" menu on the left.


![](https://static-docs.nocobase.com/mail-1733818623168.png)


2. Click the "CREATE CREDENTIALS" button and select "OAuth client ID".


![](https://static-docs.nocobase.com/mail-1733818623386.png)


3. Select "Web application".


![](https://static-docs.nocobase.com/mail-1733818623758.png)


4. Fill in the application information.


![](https://static-docs.nocobase.com/mail-1733818623992.png)


5. Enter the final deployment domain of the project (the example here is a NocoBase test address).


![](https://static-docs.nocobase.com/mail-1733818624188.png)


6. Add the authorized redirect URI. It must be `domain + "/admin/settings/mail/oauth2"`. For example: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`


![](https://static-docs.nocobase.com/mail-1733818624449.png)


7. Click create to view the OAuth information.


![](https://static-docs.nocobase.com/mail-1733818624701.png)


8. Copy the Client ID and Client secret and paste them into the email configuration page.


![](https://static-docs.nocobase.com/mail-1733818624923.png)


9. Click save to complete the configuration.

### Publish the App

After completing the above process and testing features like test user authorization login and email sending, you can publish the app.

1. Click the "OAuth consent screen" menu.


![](https://static-docs.nocobase.com/mail-1733818625124.png)


2. Click the "EDIT APP" button, then click the "SAVE AND CONTINUE" button at the bottom.


![](https://static-docs.nocobase.com/mail-1735633686380.png)



![](https://static-docs.nocobase.com/mail-1735633686750.png)


3. Click the "ADD OR REMOVE SCOPES" button to select the user permission scopes.


![](https://static-docs.nocobase.com/mail-1735633687054.png)


4. Search for "Gmail API", then check "Gmail API" (confirm the Scope value is the Gmail API with "https://mail.google.com/").


![](https://static-docs.nocobase.com/mail-1735633687283.png)


5. Click the "UPDATE" button at the bottom to save.


![](https://static-docs.nocobase.com/mail-1735633687536.png)


6. Click the "SAVE AND CONTINUE" button at the bottom of each page, and finally click the "BACK TO DASHBOARD" button to return to the dashboard page.


![](https://static-docs.nocobase.com/mail-1735633687744.png)



![](https://static-docs.nocobase.com/mail-1735633687912.png)



![](https://static-docs.nocobase.com/mail-1735633688075.png)


7. Click the "PUBLISH APP" button. A confirmation page will appear, listing the required information for publishing. Then click the "CONFIRM" button.


![](https://static-docs.nocobase.com/mail-1735633688257.png)


8. Return to the console page, and you will see the publishing status is "In production".


![](https://static-docs.nocobase.com/mail-1735633688425.png)


9. Click the "PREPARE FOR VERIFICATION" button, fill in the required information, and click the "SAVE AND CONTINUE" button (the data in the image is for demonstration purposes only).


![](https://static-docs.nocobase.com/mail-1735633688634.png)



![](https://static-docs.nocobase.com/mail-1735633688827.png)


10. Continue to fill in the necessary information (the data in the image is for demonstration purposes only).


![](https://static-docs.nocobase.com/mail-1735633688993.png)


11. Click the "SAVE AND CONTINUE" button.


![](https://static-docs.nocobase.com/mail-1735633689159.png)


12. Click the "SUBMIT FOR VERIFICATION" button to submit for verification.


![](https://static-docs.nocobase.com/mail-1735633689318.png)


13. Wait for the approval result.


![](https://static-docs.nocobase.com/mail-1735633689494.png)


14. If the approval is still pending, users can click the unsafe link to authorize and log in.


![](https://static-docs.nocobase.com/mail-1735633689645.png)