export class FakePort {
  constructor(queue = []) {
    this.queue = queue; // incoming data chunks (Uint8Array)
    this.sent = [];
    this.readable = {
      getReader: () => ({
        read: async () => {
          if (this.queue.length === 0) {
            return { value: undefined, done: true };
          }
          return { value: this.queue.shift(), done: false };
        },
        releaseLock: () => {},
        cancel: async () => {}
      })
    };
    this.writable = {
      getWriter: () => ({
        write: async (data) => { this.sent.push(data); },
        releaseLock: () => {}
      })
    };
  }

  async open() { this.opened = true; }
  async close() { this.opened = false; }
}

export class FakeSerial {
  constructor(port = new FakePort()) {
    this.port = port;
  }

  async requestPort() { return this.port; }
}
