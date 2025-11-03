---
pkg: '@nocobase/plugin-auth'
---

# Password Authentication

## Configuration Interface


![](https://static-docs.nocobase.com/202411131505095.png)


## Allow Sign Up

When sign up is allowed, the login page will display the link to create an account, and you can go to the sign up page.


![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)


Sign up page


![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)


When sign up is not allowed, the login page will not display the link to create an account.


![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)


When sign up is not allowed, the sign up page cannot be accessed.


![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)


## Sign Up Form Settings<Badge>v1.4.0-beta.7+</Badge>

You can set which fields in the user collection need to be displayed in the sign up form and whether they are required or not. At least one of username or email fields needs to be set to display and required.


![](https://static-docs.nocobase.com/202411262133669.png)


Sign up page


![](https://static-docs.nocobase.com/202411262135801.png)


## Forgot Password<Badge>v1.8.0+</Badge>

The forgot password feature allows users to reset their password via email verification if they forget it.

### Administrator Configuration

1.  **Enable Forgot Password Feature**

    In "Settings" > "Authentication" > "Forgot Password" tab, check the "Enable Forgot Password Feature" checkbox.

    
![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)


2.  **Configure Notification Channel**

    Select an email notification channel (currently only email is supported). If no notification channel is available, you need to add one first.

    
![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)


3.  **Configure Password Reset Email**

    Customize the email subject and content, supporting HTML or plain text format. You can use the following variables:

    - Current user
    - System settings
    - Reset password link
    - Reset link expiration (minutes)

    
![20250427170047](https://static-docs.nocobase.com/20250427170047.png)


4.  **Set Reset Link Expiration**

    Set the validity period (in minutes) for the reset link, default is 120 minutes.

    
![20250423073557](https://static-docs.nocobase.com/20250423073557.png)


### User Workflow

1.  **Initiate Password Reset Request**

    Click the "Forgot Password" link on the login page (requires the administrator to enable the forgot password feature first) to go to the forgot password page.

    
![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)


    Enter the registered email address and click the "Send Reset Email" button.

    
![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)


2.  **Reset Password**

    The user will receive an email containing a reset link. Click the link to open a page where you can set a new password.

    
![20250421113748](https://static-docs.nocobase.com/20250421113748.png)


    After setting it up, the user can log in to the system with the new password.

### Notes

- The reset link has a time limit, by default it is valid for 120 minutes after generation (configurable by the administrator).
- The link can only be used once and becomes invalid immediately after use.
- If the user does not receive the reset email, please check if the email address is correct or check the spam folder.
- The administrator should ensure that the mail server configuration is correct to guarantee that the reset email can be sent successfully.