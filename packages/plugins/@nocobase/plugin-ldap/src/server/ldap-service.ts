import ldapjs from 'ldapjs';
import { LDAPOption } from './types';

export class LDAPService {
  private client: ldapjs.Client;
  private options: LDAPOption;

  constructor(options) {
    const timeout = 5000;

    this.options = {
      ...(options || {}),
      baseDN: options.baseDN ? options.baseDN : '',
      reconnect: options.reconnect != undefined ? options.reconnect : false,
      connectTimeout: options.connectTimeout != undefined ? options.connectTimeout : timeout,
      timeLimit: options.timeLimit != undefined ? options.timeLimit : timeout,
    };

    this.client = ldapjs.createClient(this.options);
  }

  public authenticate(username, password): Promise<{ success: boolean }> {
    const { baseDN, ldapUrl } = this.options;
    const isTLS = ldapUrl.startsWith('ldaps');
    const dn = baseDN ? `cn=${username},${baseDN}` : `cn=${username}`;

    return new Promise((resolve, reject) => {
      if (isTLS) {
        this.client.starttls(this.options.tlsOptions, null, (error) => {
          if (error) {
            reject({ success: false, error });
            this.unbindServer();
          } else {
            this.bindServer({ dn, password, success: resolve, fail: reject });
          }
        });
      } else {
        this.bindServer({ dn, password, success: resolve, fail: reject });
      }
    });
  }

  public searchUser(username, scope = 'sub') {
    const config = {
      filter: `(cn=${username})`,
      scope,
    };

    return new Promise((resolve, reject) => {
      this.client.search(this.options.baseDN, config, (error, response) => {
        if (error) {
          reject({ success: false, error });
          this.unbindServer();
        } else {
          let user = null;

          response.on('searchEntry', (entry) => {
            user = entry.object;
          });

          response.on('end', (result) => {
            if (result.status !== 0) {
              reject({ success: false, error: new Error('LDAP Search Failed.') });
              this.unbindServer();
            } else {
              resolve({ success: true, result: user });
            }
          });

          response.on('error', (error) => reject({ success: false, error }));
        }
      });
    });
  }

  private bindServer({ dn, password, success, fail }) {
    this.client.bind(dn, password, (error) => {
      if (error) {
        fail({ success: false, error });
        this.unbindServer();
      } else {
        success({ success: true });
      }
    });
  }

  private unbindServer() {
    if (!this.client) {
      return;
    }

    this.client.unbind();
  }
}
