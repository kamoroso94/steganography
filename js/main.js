import Steganography from './Steganography.js';
import SteganographyError from './SteganographyError.js';
import { loadImage } from './graphics.js';

window.addEventListener('load', () => {
  const form = document.querySelector('form');
  const messageElem = document.getElementById('message');
  const sizeElem = document.getElementById('message-size');
  const uploader = document.getElementById('uploader');

  const clippy = new ClipboardJS('#copy-btn', {
    target(trigger) {
      const output = document.getElementById('output-result');
      const target = output.firstElementChild;
      console.log(target);
      return target;
    }
  });
  clippy.on('success', console.log);
  clippy.on('error', console.error);

  messageElem.addEventListener('input', () => {
    const byteCount = new TextEncoder().encode(messageElem.value).length;
    sizeElem.textContent = byteCount;

    const sizeContainer = sizeElem.parentNode;
    sizeContainer.classList.toggle('text-danger', byteCount == 0);
    sizeContainer.classList.toggle('text-muted', byteCount != 0);
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const output = document.getElementById('output-result');
    const result = output.firstElementChild;
    // TODO: finish
  });

  const stegActionElem = document.getElementById('steg-action');
  stegActionElem.addEventListener('change', () => {
    form.reset();

    const isEncodeOpt = stegActionElem.value == 'encode';
    messageElem.parentNode.classList.toggle('hidden', !isEncodeOpt);

    const submitMsg = isEncodeOpt ? 'Encode' : 'Decode';
    document.getElementById('submit-btn').textContent = submitMsg;

    const copyBtn = document.getElementById('copy-btn');
    copyBtn.classList.toggle('hidden', isEncodeOpt);

    if(isEncodeOpt) {
      messageElem.removeAttribute('disabled');
    } else {
      messageElem.setAttribute('disabled', true);
    }
  });

  form.addEventListener('reset', (event) => {
    event.preventDefault();

    messageElem.value = '';
    sizeElem.textContent = 0;
    sizeElem.parentNode.classList.remove('text-muted');
    sizeElem.parentNode.classList.add('text-danger');
    uploader.value = null;
    hideOutput();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageElem.value;
    if(!messageElem.disabled && message.length == 0) return;

    const img = await getInputImage();
    if(!img) return;

    const stegAction = document.getElementById('steg-action').value;
    let result;

    try {
      result = await perfromSteg(stegAction, message, img);
      document.getElementById('result-buttons').classList.remove('hidden');
    } catch(error) {
      if(!(error instanceof SteganographyError)) throw error;
      result = createAlert('danger', error.message);
      console.log(error);
    }

    const isError = result.classList.contains('alert');
    const resultButtons = document.getElementById('result-buttons');
    resultButtons.classList.toggle('hidden', isError);
    showOutput(result);
  });
});

async function perfromSteg(action, message, img) {
  if(action == 'encode') return await encodeMessage(message, img);
  if(action == 'decode') return decodeMessage(img);
  throw new Error(`Unknown stegOption '${stegOption}'`);
}

function createAlert(type, message) {
  const alert = document.createElement('div');
  alert.classList.add('alert', `alert-${type}`, 'alert-dismissible');
  alert.append(message);
  return alert;
}

async function encodeMessage(message, img) {
  const encodedImg = await Steganography.encode(message, img);
  encodedImg.classList.add('img-thumbnail');
  return encodedImg;
}

function decodeMessage(img) {
  const message = Steganography.decode(img);
  return createReadonlyTextarea(message);
}

function createReadonlyTextarea(text) {
  const textarea = document.createElement('textarea');

  textarea.classList.add('form-control');
  textarea.setAttribute('readonly', true);
  textarea.setAttribute('rows', 10);
  textarea.value = text;

  return textarea;
}

function getInputImage() {
  const uploader = document.getElementById('uploader');
  const [ imgFile ] = uploader.files;
  if(!imgFile) return null;
  const url = window.URL.createObjectURL(imgFile);
  return loadImage(url);
}

function saveText(text) {

}

function saveImage() {

}

function showOutput(elem) {
  const container = document.getElementById('output-container');
  const output = container.querySelector('output');
  clearOutput();
  container.classList.remove('hidden');
  output.append(elem);
}

function hideOutput() {
  const container = document.getElementById('output-container');
  container.classList.add('hidden');
  clearOutput();
}

function clearOutput() {
  const container = document.getElementById('output-container');
  const output = container.querySelector('output');
  container.classList.add('hidden');

  while(output.firstChild) {
    output.firstChild.remove();
  }
}
