import { SerialManager } from '../src/SerialManager.js';

const output = document.getElementById('output');
const input = document.getElementById('input');
const connectBtn = document.getElementById('connect');
const disconnectBtn = document.getElementById('disconnect');
const sideConnectBtn = document.getElementById('side-connect');
const sideDisconnectBtn = document.getElementById('side-disconnect');
const sendBtn = document.getElementById('send');
const fieldsDiv = document.getElementById('fields');
const addFieldBtn = document.getElementById('add-field');
const statusBar = document.getElementById('status');
const title = document.getElementById('title');
const tabTx = document.getElementById('tab-tx');
const tabRx = document.getElementById('tab-rx');
const txPage = document.getElementById('tx-page');
const rxPage = document.getElementById('rx-page');

function setStatus(text) {
  statusBar.textContent = text;
}

const manager = new SerialManager(navigator.serial, (msg) => {
  output.value += JSON.stringify(msg) + '\n';
});

setStatus('Disconnected');

function showPage(page) {
  txPage.classList.toggle('active', page === 'tx');
  rxPage.classList.toggle('active', page === 'rx');
  tabTx.classList.toggle('active', page === 'tx');
  tabRx.classList.toggle('active', page === 'rx');
  title.textContent = page === 'tx' ? 'Transmit' : 'Receive';
}

tabTx.addEventListener('click', () => showPage('tx'));
tabRx.addEventListener('click', () => showPage('rx'));

function createBuilder(isArray) {
  const container = document.createElement('div');
  container.className = isArray ? 'builder-array' : 'builder-object';
  const fields = document.createElement('div');
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = isArray ? 'Add Item' : 'Add Field';
  add.addEventListener('click', () => {
    fields.appendChild(createField(isArray));
    updatePreview();
  });
  container.append(fields, add);
  return { container, fields };
}

function createField(isArrayItem = false) {
  const div = document.createElement('div');
  div.className = 'field-row';
  const field = {};

  if (!isArrayItem) {
    field.keyInput = document.createElement('input');
    field.keyInput.placeholder = 'key';
    div.appendChild(field.keyInput);
  }

  field.typeSelect = document.createElement('select');

  ['string', 'int', 'float', 'boolean', 'array', 'object'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;

    field.typeSelect.appendChild(opt);
  });
  div.appendChild(field.typeSelect);

  field.valueContainer = document.createElement('div');
  div.appendChild(field.valueContainer);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    div.remove();
    updatePreview();
  });
  div.appendChild(removeBtn);

  function updateValue() {
    field.valueContainer.innerHTML = '';
    field.valueInput = null;
    field.fields = null;
    switch (field.typeSelect.value) {
      case 'boolean': {
        const sel = document.createElement('select');
        sel.innerHTML = '<option value="true">true</option><option value="false">false</option>';
        field.valueInput = sel;
        break;
      }
      case 'int': {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = '1';
        field.valueInput = inp;
        break;
      }
      case 'float': {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = 'any';
        field.valueInput = inp;
        break;
      }
      case 'string': {
        field.valueInput = document.createElement('input');
        break;
      }
      case 'array': {
        const b = createBuilder(true);
        field.fields = b.fields;
        field.valueContainer.appendChild(b.container);
        break;
      }
      case 'object': {
        const b = createBuilder(false);
        field.fields = b.fields;
        field.valueContainer.appendChild(b.container);
        break;
      }
    }
    if (field.valueInput) field.valueContainer.appendChild(field.valueInput);
    updatePreview();
  }

  field.typeSelect.addEventListener('change', updateValue);
  updateValue();

  div._field = { field, isArrayItem };
  return div;
}

function buildFields(parent, isArray) {
  const result = isArray ? [] : {};
  parent.querySelectorAll(':scope > .field-row').forEach(row => {
    const { field, isArrayItem } = row._field;
    const type = field.typeSelect.value;
    let value;
    if (type === 'array') {
      value = buildFields(field.fields, true);
    } else if (type === 'object') {
      value = buildFields(field.fields, false);
    } else if (type === 'boolean') {
      value = field.valueInput.value === 'true';
    } else if (type === 'int') {
      value = parseInt(field.valueInput.value, 10);
    } else if (type === 'float') {
      value = parseFloat(field.valueInput.value);
    } else {
      value = field.valueInput.value;
    }
    if (isArray) {
      result.push(value);
    } else {
      const key = field.keyInput.value.trim();
      if (key) result[key] = value;
    }
  });
  return result;
}

function updatePreview() {
  input.value = JSON.stringify(buildFields(fieldsDiv, false), null, 2);
}

function buildJson() {
  return buildFields(fieldsDiv, false);
}

// update preview whenever any field input changes
fieldsDiv.addEventListener('input', updatePreview);
fieldsDiv.addEventListener('change', updatePreview);

addFieldBtn.addEventListener('click', () => {
  fieldsDiv.appendChild(createField(false));
  updatePreview();
});

// start with one field
fieldsDiv.appendChild(createField(false));
updatePreview();

async function handleConnect() {
  try {
    setStatus('Connecting...');
    await manager.connect();
    if (connectBtn) connectBtn.disabled = true;
    sideConnectBtn.disabled = true;
    if (disconnectBtn) disconnectBtn.disabled = false;
    sideDisconnectBtn.disabled = false;
    sendBtn.disabled = false;
    setStatus('Connected');
  } catch (e) {
    setStatus('Disconnected');
    alert(e.message);
  }
}

async function handleDisconnect() {
  await manager.disconnect();
  if (connectBtn) connectBtn.disabled = false;
  sideConnectBtn.disabled = false;
  if (disconnectBtn) disconnectBtn.disabled = true;
  sideDisconnectBtn.disabled = true;
  sendBtn.disabled = true;
  setStatus('Disconnected');
}

if (connectBtn) connectBtn.addEventListener('click', handleConnect);
sideConnectBtn.addEventListener('click', handleConnect);

if (disconnectBtn) disconnectBtn.addEventListener('click', handleDisconnect);
sideDisconnectBtn.addEventListener('click', handleDisconnect);

sendBtn.addEventListener('click', async () => {
  try {
    const msg = buildJson();
    input.value = JSON.stringify(msg, null, 2);
    await manager.send(msg);
  } catch (e) {
    alert(e.message);
  }
});
