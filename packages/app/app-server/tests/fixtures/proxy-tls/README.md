# Proxy TLS test fixtures

These public test credentials are only for local HTTPS and WebSocket upstream tests. Both server certificates use `server-key.pem` and are signed by `ca.pem`; the CA private key is intentionally not retained. Certificates are valid from 2020-01-01 through 2120-01-01 to avoid clock-dependent failures.

- `server-cert.pem` has SANs for `127.0.0.1` and `localhost`.
- `wrong-host-cert.pem` has only `wrong.example.invalid`, so it is trusted but fails hostname verification for the local upstream.

The suite temporarily adds the test CA to Node's default trust store and restores the original store after each case. It never disables certificate verification. The untrusted-certificate cases use the original store without the test CA. Tests need no certificate generation tools at runtime.
