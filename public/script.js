import { SerialManager } from '../src/SerialManager.js';

const output = document.getElementById('output');
const input = document.getElementById('input');
const connectBtn = document.getElementById('connect');
const disconnectBtn = document.getElementById('disconnect');
const sendBtn = document.getElementById('send');
const fieldsDiv = document.getElementById('fields');
const addFieldBtn = document.getElementById('add-field');

const manager = new SerialManager(navigator.serial, (msg) => {
  output.value += JSON.stringify(msg) + '\n';
});

function createField() {
  const div = document.createElement('div');
  div.className = 'field-row';

  const keyInput = document.createElement('input');
  keyInput.placeholder = 'key';

  const typeSelect = document.createElement('select');
  ['string', 'int', 'float', 'boolean', 'array', 'object'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });

  let valueInput;
  function updateValueInput() {
    const old = valueInput;
    if (typeSelect.value === 'boolean') {
      const sel = document.createElement('select');
      sel.innerHTML = '<option value="true">true</option><option value="false">false</option>';
      valueInput = sel;
    } else {
      const inp = document.createElement('input');
      inp.placeholder = 'value';
      if (typeSelect.value === 'int') {
        inp.type = 'number';
        inp.step = '1';
      } else if (typeSelect.value === 'float') {
        inp.type = 'number';
        inp.step = 'any';
      }
      valueInput = inp;
    }
    if (old) div.replaceChild(valueInput, old); else div.appendChild(valueInput);
  }

  typeSelect.addEventListener('change', updateValueInput);
  updateValueInput();

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => div.remove());

  div.append(keyInput, typeSelect, valueInput, removeBtn);
  return div;
}

addFieldBtn.addEventListener('click', () => {
  fieldsDiv.appendChild(createField());
});

// start with one field
fieldsDiv.appendChild(createField());

function buildJson() {
  const obj = {};
  fieldsDiv.querySelectorAll('.field-row').forEach(row => {
    const [keyInput, typeSelect, valueInput] = row.children;
    const key = keyInput.value.trim();
    if (!key) return;
    let value = valueInput.value;
    switch (typeSelect.value) {
      case 'int':
        value = parseInt(value, 10);
        break;
      case 'float':
        value = parseFloat(value);
        break;
      case 'boolean':
        value = value === 'true';
        break;
      case 'array':
      case 'object':
        try {
          value = JSON.parse(value);
        } catch (e) {
          throw new Error(`Invalid JSON in field "${key}"`);
        }
        break;
      case 'string':
      default:
        // keep as string
        break;
    }
    obj[key] = value;
  });
  return obj;
}

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
    const msg = buildJson();
    input.value = JSON.stringify(msg, null, 2);
    await manager.send(msg);
  } catch (e) {
    alert(e.message);
  }
});
