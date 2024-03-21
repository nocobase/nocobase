export default {
  syncTrigger: class {
    constructor(public readonly workflow) {}
    on() {}
    off() {}
    sync = true;
    validateEvent() {
      return true;
    }
  },
  asyncTrigger: class {
    constructor(public readonly workflow) {}
    on() {}
    off() {}
    validateEvent() {
      return true;
    }
  },
};
