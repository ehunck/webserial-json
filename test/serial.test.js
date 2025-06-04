import test from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert/strict';
import { SerialManager, STATES } from '../src/SerialManager.js';
import { FakeSerial, FakePort } from './fakeSerial.js';

// helper to encode string to Uint8Array
const enc = (str) => new TextEncoder().encode(str);

test('state transitions and message handling', async (t) => {
  const port = new FakePort([enc('{"foo":1}')]);
  const serial = new FakeSerial(port);
  const messages = [];
  const manager = new SerialManager(serial, (msg) => messages.push(msg));

  strictEqual(manager.state, STATES.DISCONNECTED);
  await manager.connect();
  strictEqual(manager.state, STATES.CONNECTED);

  // process incoming message
  await manager.readLoopPromise;
  deepStrictEqual(messages, [{ foo: 1 }]);

  await manager.send({ bar: 2 });
  strictEqual(port.sent.length, 1);
  const sentText = new TextDecoder().decode(port.sent[0]);
  strictEqual(sentText, '{"bar":2}');

  await manager.disconnect();
  strictEqual(manager.state, STATES.DISCONNECTED);
});
