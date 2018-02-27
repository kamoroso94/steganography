import Steganography, { EncodingError, DecodingError } from './Steganography.js';
import { loadImage } from './graphics.js';

// TODO: go over everything here

window.addEventListener('load', async () => {
  console.log('Hello, nosy, ain\'t ya?');

  const form = document.querySelector('form');
  const messageBox = document.getElementById('message');
  const output = document.getElementById('output');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageBox.value;
    if(!messageBox.disabled && message.length == 0) return;

    const img = await getInputImage();
    if(!img) return;

    clearElement(output);
    const stegOption = getStegOption();
    let result;

    try {
      const steg = new Steganography();

      switch(stegOption) {
        case 'encode':
          execStegEncode(message, img, output);
          break;

        case 'decode':
          execStegDecode(img, output);
          break;

        default:
          throw new Error(`Unknown stegOption '${stegOption}'`);
      }
    } catch(error) {
      if(!(error instanceof EncodingError || error instanceof DecodingError)) {
        throw error;
      }

      displayAlert('danger', error.message);
    }
  });

  setupRadios(messageBox, output);
});

function displayAlert(type, message) {
  const alert = document.createElement('div');
  alert.classList.add('alert', `alert-${type}`, 'alert-dismissible');
  const closeX = document.createElement('a');
  closeX.setAttribute('href', '#');
  closeX.setAttribute('data-dismiss', 'alert');
  closeX.setAttribute('aria-label', 'close');
  closeX.textContent = '\u00d7';
  closeX.classList.add('close');
  alert.appendChild(closeX);
  alert.appendChild(document.createTextNode(message));

  document.querySelector('.container').prepend(alert);
}

async function execStegEncode(message, img, output) {
  const steg = new Steganography(1);
  const result = await steg.encode(message, img);
  result.classList.add('img-thumbnail');
  output.appendChild(result);
}

function execStegDecode(img, output) {
  const result = Steganography.decode(img);
  const textarea = createReadonlyTextarea(result);
  output.appendChild(textarea);
}

function createReadonlyTextarea(text) {
  const textarea = document.createElement('textarea');
  textarea.classList.add('form-control');
  textarea.setAttribute('readonly', true);
  textarea.setAttribute('rows', 10);
  textarea.value = text;

  return textarea;
}

function getStegOption() {
  const stegOpts = document.getElementsByName('steg-option');
  return [...stegOpts].find(stegOpt => stegOpt.checked).value;
}

function getInputImage() {
  const uploader = document.getElementById('uploader');
  const imgFile = uploader.files[0];
  if(!imgFile) return null;
  const url = window.URL.createObjectURL(imgFile);
  return loadImage(url);
}

function setupRadios(messageBox, output) {
  const stegOpts = document.getElementsByName('steg-option');

  for(const stegOpt of stegOpts) {
    stegOpt.addEventListener('change', () => {
      if(!stegOpt.checked) return;
      clearElement(output);

      const isDecodeOpt = stegOpt.value == 'decode';
      messageBox.parentNode.classList.toggle('hidden', isDecodeOpt);

      if(isDecodeOpt) {
        messageBox.setAttribute('disabled', true);
      } else {
        messageBox.removeAttribute('disabled');
      }
    });
  }
}

function clearElement(elem) {
  while(elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}
