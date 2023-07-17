import { Subject } from 'rxjs';
import Application from '../application';

interface EventObject {
  name: string;
  options: any;
}

export class ApplicationEventSubject {
  private events: Subject<EventObject> = new Subject();

  constructor(app: Application) {
    this.events.subscribe({
      next: (event) => {
        app.emit(event.name, event.options);
      },
    });
  }

  push(name: string, options: any) {
    this.events.next({ name, options });
  }
}
