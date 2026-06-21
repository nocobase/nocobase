---
pkg: "@nocobase/plugin-email-manager"
---

# Google Configuration

### Prerequisites

For users to be able to integrate Google Gmail into NocoBase, the system must be deployed on a server that supports access to Google services. The backend will call the Google API.

### Register Account

1. Open https://console.cloud.google.com/welcome to enter Google Cloud
2. On first entry, you need to agree to the relevant terms

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Create App

1. Click "Select a project" at the top

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Click the "NEW PROJECT" button in the pop-up layer

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Fill in the project information

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. After the project is created, select the project

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Enable Gmail API

1. Click the "APIs & Services" button

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Enter the APIs & Services panel

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Search for **mail**

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Click the **ENABLE** button to enable Gmail API

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Configure OAuth Consent Screen

1. Click the "OAuth consent screen" menu on the left

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Select **External**

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Fill in the project information (for display on the subsequent authorization page) and click save

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Fill in Developer contact information and click continue

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Click continue

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Add test users for testing before app publication

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Click continue

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Review the overview information and return to the dashboard

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Create Credentials

1. Click the **Credentials** menu on the left

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Click the "CREATE CREDENTIALS" button and select "OAuth client ID"

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Select "Web application"

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Fill in the application information

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Fill in the domain where the application will be finally deployed (this example is NocoBase's test address)

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Add the authorized callback address, which must be `domain + "/admin/settings/mail/oauth2"`, for example: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Click create to view OAuth information

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Copy the Client ID and Client Secret content and fill them into the email configuration page

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Click save to complete the configuration

### Application Publication

Proceed with publication after the above process is completed and test users authorize login, email sending, and other feature tests are finished.

1. Click the "OAuth consent screen" menu

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Click the "EDIT APP" button, then click "SAVE AND CONTINUE" button at the bottom

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Click the "ADD OR REMOVE SCOPES" button to select user permission scopes

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Search for "Gmail API" and check "Gmail API" (confirm that the Scope value is "https://mail.google.com/")

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Click the **UPDATE** button at the bottom to save

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Click "SAVE AND CONTINUE" button at the bottom of each page, then finally click "BACK TO DASHBOARD" button to return to the dashboard page

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Click the **PUBLISH APP** button and a publication confirmation page appears showing the information required for publication. Then click the **CONFIRM** button

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Return to the console page again, and you can see the publication status is "In production"

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Click the "PREPARE FOR VERIFICATION" button, fill in the required information, and click the "SAVE AND CONTINUE" button (data in the image is for example only)

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Continue filling in the necessary information (data in the image is for example only)

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Click the "SAVE AND CONTINUE" button

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Click the "SUBMIT FOR VERIFICATION" button to submit Verification

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Wait for the approval result

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. In case the approval has not been passed yet, users can click the unsafe link to authorize login

![](https://static-docs.nocobase.com/mail-1735633689645.png)