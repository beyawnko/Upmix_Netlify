import './styles/index.css';
import { AudioEngine } from './audio/AudioEngine';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="container">
    <header class="header">
      <h1>Audio Upmixer</h1>
    </header>
    
    <div class="stems">
      ${['Vocals', 'Bass', 'Drums', 'Other'].map(stem => `
        <div class="stem-control">
          <h2>${stem}</h2>
          
          <div class="control-group">
            <label>Width</label>
            <input type="range" id="${stem.toLowerCase()}-width" min="0" max="2" step="0.1" value="1">
          </div>
          
          <div class="control-group">
            <label>Depth</label>
            <input type="range" id="${stem.toLowerCase()}-depth" min="0" max="1" step="0.1" value="0.5">
          </div>
          
          <div class="control-group">
            <label>Haas</label>
            <input type="range" id="${stem.toLowerCase()}-haas" min="0" max="30" step="1" value="0">
          </div>
          
          <div class="control-group">
            <label>Level</label>
            <input type="range" id="${stem.toLowerCase()}-level" min="-60" max="0" step="1" value="0">
          </div>
        </div>
      `).join('')}
    </div>

    <div class="transport">
      <button id="start" class="primary">Play</button>
      <button id="stop" class="secondary">Stop</button>
      <div class="file-input-wrapper">
        <button class="file-input-button">Load Stems</button>
        <input type="file" multiple accept="audio/*" id="file-input">
      </div>
    </div>
  </div>
`;

const engine = new AudioEngine();

document.querySelector('#file-input').addEventListener('change', async (e) => {
  const files = e.target.files;
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const name = file.name.split('.')[0].toLowerCase();
    await engine.loadStem(name, url);
  }
});

function updateStemParameters(name) {
  engine.setStemParameters(name, {
    width: parseFloat(document.querySelector(`#${name}-width`).value),
    depth: parseFloat(document.querySelector(`#${name}-depth`).value),
    haasDelay: parseFloat(document.querySelector(`#${name}-haas`).value),
    level: parseFloat(document.querySelector(`#${name}-level`).value)
  });
}

['vocals', 'bass', 'drums', 'other'].forEach(stem => {
  ['width', 'depth', 'haas', 'level'].forEach(param => {
    document.querySelector(`#${stem}-${param}`).addEventListener('input', () => {
      updateStemParameters(stem);
    });
  });
});

document.querySelector('#start').addEventListener('click', () => engine.start());
document.querySelector('#stop').addEventListener('click', () => engine.stop());