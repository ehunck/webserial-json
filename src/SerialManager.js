export const STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting'
};

export class SerialManager {
  constructor(serialInterface, messageHandler = () => {}, encoder = JSON.stringify, decoder = JSON.parse) {
    this.serial = serialInterface;
    this.messageHandler = messageHandler;
    this.encoder = encoder;
    this.decoder = decoder;
    this.state = STATES.DISCONNECTED;
    this.port = null;
    this.reader = null;
    this.writer = null;
  }

  async connect(options = { baudRate: 9600 }) {
    if (this.state !== STATES.DISCONNECTED) {
      throw new Error('Already connecting or connected');
    }
    this.state = STATES.CONNECTING;
    try {
      this.port = await this.serial.requestPort();
      await this.port.open(options);
      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();
      this.state = STATES.CONNECTED;
      this._readLoop();
    } catch (err) {
      this.state = STATES.DISCONNECTED;
      throw err;
    }
  }

  async _readLoop() {
    try {
      while (this.state === STATES.CONNECTED) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          const text = new TextDecoder().decode(value);
          try {
            const message = this.decoder(text);
            this.messageHandler(message);
          } catch (e) {
            // ignore decode errors
          }
        }
      }
    } catch (e) {
      // reading stopped
    }
  }

  async send(obj) {
    if (this.state !== STATES.CONNECTED) {
      throw new Error('Not connected');
    }
    const text = this.encoder(obj);
    const data = new TextEncoder().encode(text);
    await this.writer.write(data);
  }

  async disconnect() {
    if (this.state !== STATES.CONNECTED) {
      throw new Error('Not connected');
    }
    this.state = STATES.DISCONNECTING;
    try {
      await this.reader.cancel().catch(() => {});
      this.reader.releaseLock();
      if (this.writer) {
        this.writer.releaseLock();
      }
      await this.port.close();
    } finally {
      this.state = STATES.DISCONNECTED;
    }
  }
}
