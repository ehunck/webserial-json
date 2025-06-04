import { SerialManager } from '../src/SerialManager.js';

const output = document.getElementById('output');
const input = document.getElementById('input');
const connectBtn = document.getElementById('connect');
const disconnectBtn = document.getElementById('disconnect');
const sendBtn = document.getElementById('send');

const manager = new SerialManager(navigator.serial, (msg) => {
  output.value += JSON.stringify(msg) + '\n';
});

connectBtn.addEventListener('click', async () => {
  try {
    await manager.connect();
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    sendBtn.disabled = false;
  } catch (e) {
    alert(e.message);
  }
});

disconnectBtn.addEventListener('click', async () => {
  await manager.disconnect();
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
  sendBtn.disabled = true;
});

sendBtn.addEventListener('click', async () => {
  try {
    const msg = JSON.parse(input.value);
    await manager.send(msg);
  } catch (e) {
    alert('Invalid JSON');
  }
});
