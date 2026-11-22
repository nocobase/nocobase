import type { Application } from '@nocobase/app-server/application';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { ServiceProvider } from '@nocobase/service-provider';

/** The application's directory of people for the agents plugin, which owns no user model: sharing and names. */
export default class ConversationSharingProvider extends ServiceProvider<Application> {
  public readonly name = 'app/conversation-sharing';
  public override async boot(): Promise<void> {
    // A composition without the agents plugin has no directory to provide.
    if (!this.app.container.has(agentsToken)) return;
    this.app.container.resolve(agentsToken).people.provide({
      list: async (conn) =>
        conn.repository<{ id: string; name: string }>('user').findMany({
          filter: (f) =>
            f.and([
              f.string('kind').eq('person'),
              f.date('disabledAt').empty(),
              f.date('deletedAt').empty(),
            ]),
          select: (s) => s.fields('id', 'name'),
          sort: (s) => s.field('name').asc(),
        }),
      names: async (conn, ids) =>
        new Map(
          (
            await conn
              .repository<{ id: string; name: string }>('user')
              .findMany({
                filter: (f) => f.or(ids.map((id) => f.string('id').eq(id))),
                select: (s) => s.fields('id', 'name'),
              })
          ).map((user) => [user.id, user.name]),
        ),
      inactive: async (conn, ids) =>
        new Set(
          (
            await conn.repository<{ id: string }>('user').findMany({
              filter: (f) =>
                f.and([
                  f.or(ids.map((id) => f.string('id').eq(id))),
                  f.or([
                    f.date('disabledAt').notEmpty(),
                    f.date('deletedAt').notEmpty(),
                  ]),
                ]),
              select: (s) => s.fields('id'),
            })
          ).map((user) => user.id),
        ),
    });
  }
}
