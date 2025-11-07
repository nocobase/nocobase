# Google Workspace

## Set Google as IdP

[Google Admin Console](https://admin.google.com/) - Apps - Web and mobile apps


![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)


After setting up the app, copy the **SSO URL**, **Entity ID**, and **Certificate**.


![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)


## Add a new Authenticator on NocoBase

Plugin Settings - User Authentication - Add - SAML


![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)


Enter the copied information respectively:

- SSO URL: SSO URL
- Public Certificate: Certificate
- idP Issuer: Entity ID
- http: Check if you are testing locally with http

Then copy the SP Issuer/EntityID and ACS URL from Usage.

## Fill in SP Information on Google

Go back to the Google Console, on the **Service Provider Details** page, enter the ACS URL and Entity ID copied earlier, and check **Signed Response**.


![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)



![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)


Under **Attribute Mapping**, add mappings for the corresponding attributes.


![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)