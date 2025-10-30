# Google Workspace

## Set Google as IdP

[Google Admin console](https://admin.google.com/) - Apps - Web and mobile apps


![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)


After configuring the application, copy the **SSO URL**, **Entity ID**, and **Certificate**.


![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)


## Add an authenticator on NocoBase

Plugin settings - User Authentication - Add - SAML


![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)


Fill in the information you just copied.

- SSO URL: SSO URL
- Public Certificate: Certificate
- idP Issuer: Entity ID
- http: Check if you are testing locally with http

Then copy the SP Issuer/EntityID and ACS URL from the Usage section.

## Fill in SP information on Google

Go back to the Google Admin console, on the **Service provider details** page, enter the ACS URL and Entity ID you just copied, and check **Signed response**.


![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)



![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)


In the **Attribute mapping** section, add mappings to map the corresponding attributes.


![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)