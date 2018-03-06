import Steganography from './Steganography.js';
import SteganographyError from './SteganographyError.js';
import { loadImage } from './graphics.js';

window.addEventListener('load', () => {
  const form = document.querySelector('form');
  const messageElem = document.getElementById('message');
  const uploader = document.getElementById('uploader');

  document.getElementById('steg-action').addEventListener('change', () => {
    form.reset();

    const isEncodeAction = getStegAction() == 'encode';
    messageElem.parentNode.classList.toggle('hidden', !isEncodeAction);

    const submitMsg = isEncodeAction ? 'Encode' : 'Decode';
    document.getElementById('submit-btn').textContent = submitMsg;

    const copyBtn = document.getElementById('copy-btn');
    copyBtn.classList.toggle('hidden', isEncodeAction);

    if(isEncodeAction) {
      messageElem.removeAttribute('disabled');
      copyBtn.setAttribute('disabled', true);
    } else {
      messageElem.setAttribute('disabled', true);
      copyBtn.removeAttribute('disabled');
    }
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const output = document.getElementById('result-output');
    const result = output.querySelector('img,textarea');
    if(!result) return;

    const resultTag = result.tagName.toLowerCase();

    if(resultTag == 'img') {
      const url = result.src;
      download(url, 'secret.png');
    } else {
      const blob = new Blob([result.value]);
      const url = window.URL.createObjectURL(blob);
      download(url, 'secret.txt');
      window.URL.revokeObjectURL(url);
    }
  });

  document.getElementById('copy-btn').addEventListener('click', () => {
    const output = document.getElementById('result-output');
    const target = output.querySelector('textarea');
    if(!target) return;
    target.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  });

  form.addEventListener('reset', (event) => {
    event.preventDefault();

    messageElem.value = '';
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

function getStegAction() {
  return document.getElementById('steg-action').value;
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

function download(url, fileName='download') {
  const aTag = document.createElement('a');
  aTag.href = url;
  aTag.download = fileName;
  aTag.classList.add('hidden');
  aTag.click();
}

function showOutput(elem) {
  const container = document.getElementById('result-container');
  const output = container.querySelector('output');
  clearOutput();
  container.classList.remove('hidden');
  output.append(elem);
}

function hideOutput() {
  const container = document.getElementById('result-container');
  container.classList.add('hidden');
  clearOutput();
}

function clearOutput() {
  const container = document.getElementById('result-container');
  const output = container.querySelector('output');
  container.classList.add('hidden');

  const img = output.querySelector('img');
  if(img) {
    window.URL.revokeObjectURL(img.src);
  }

  while(output.firstChild) {
    output.firstChild.remove();
  }
}
