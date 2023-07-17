import { Subject, delayWhen, interval } from 'rxjs';
import Application from '../application';

interface EventObject {
  name: string;
  options: any;
}

export class ApplicationEventSubject {
  private events: Subject<EventObject> = new Subject();

  constructor(app: Application) {
    this.events
      .pipe(
        delayWhen((value, index) => {
          const options = value.options;
          if (options && options.__$delay) {
            return interval(options.__$delay);
          }

          return interval(0);
        }),
      )
      .subscribe({
        next: (event) => {
          app.emit(`rpc:${event.name}`, event.options);
        },
      });
  }

  push(name: string, options: any) {
    this.events.next({ name, options });
  }
}
