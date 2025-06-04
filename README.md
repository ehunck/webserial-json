# webserial-json

This project demonstrates using the Web Serial API to send and receive JSON
messages. The `SerialManager` class implements a small state machine that can
connect to a serial port, send JSON encoded data, and dispatch received messages.
A simple example web page lives in `public/`.

## Development

Tests use Node's built in test runner and can be executed with:

```bash
npm test
```
