import Steganography from './Steganography.js';
import { loadImage } from './graphics.js';

window.addEventListener('load', async () => {
  console.log('Hello, nosy, ain\'t ya?');

  const form = document.querySelector('form');
  const messageBox = document.getElementById('message');
  const output = document.querySelector('output');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageBox.value;
    if(!messageBox.disabled && message.length == 0) return;

    const img = await getInputImage();
    if(!img) return;

    clearElement(output);
    const stegOption = getStegOption();
    let result;
    if(stegOption == 'encode') {
      execStegEncode(message, img, output);
    } else if(stegOption == 'decode') {
      execStegDecode(img, output);
    } else {
      throw new Error(`Unknown stegOption '${stegOption}'`);
    }
  });

  setupRadios(messageBox, output);
});

async function execStegEncode(message, img, output) {
  const result = await Steganography.encode(message, img);
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
