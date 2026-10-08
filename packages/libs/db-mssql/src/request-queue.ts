/** The parts of a Tedious connection and request used by Knex's queue. */
export interface SqlRequest {
  once(event: 'requestCompleted', listener: () => void): unknown;
}

export interface RequestConnection {
  readonly state: { readonly name: string };
  execSql(request: SqlRequest): void;
}

// Knex 3 keeps requestQueue on the MSSQL client prototype. A request queued
// while its connection is busy can then be taken by a different connection,
// even one belonging to another transaction. Ownership must follow the
// physical connection, including when Knex clones clients for savepoints.
const queues = new WeakMap<RequestConnection, SqlRequest[]>();

export function chompRequests(connection: RequestConnection): void {
  if (connection.state.name !== 'LoggedIn') return;
  const request = queues.get(connection)?.shift();
  if (request) connection.execSql(request);
}

export function enqueueRequest(
  request: SqlRequest,
  connection: RequestConnection,
): void {
  let queue = queues.get(connection);
  if (!queue) {
    queue = [];
    queues.set(connection, queue);
  }
  queue.push(request);
  // Also drain after streams and failed requests, whose Knex callbacks do
  // not necessarily advance the queue. Tedious restores LoggedIn first.
  request.once('requestCompleted', () => {
    process.nextTick(() => chompRequests(connection));
  });
  chompRequests(connection);
}
