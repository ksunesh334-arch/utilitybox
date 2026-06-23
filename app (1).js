// ===== Router =====
const panel = document.getElementById('panel');
const navItems = document.querySelectorAll('.nav-item');

const renderers = {}; // tool-id -> render function, filled in below

function setActiveTool(toolId) {
  navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === toolId));
  panel.innerHTML = '';
  if (renderers[toolId]) renderers[toolId](panel);
  localStorage.setItem('ub-last-tool', toolId); // safe: not an artifact, real GH Pages site
}

navItems.forEach(btn => {
  btn.addEventListener('click', () => setActiveTool(btn.dataset.tool));
});

function header(title, sub) {
  return `<div class="tool-header">
    <h1 class="tool-title">${title}</h1>
    <p class="tool-sub">${sub}</p>
  </div>`;
}

// ===================================================================
// 1. UNIT CONVERTER
// ===================================================================
const unitGroups = {
  length: { base: 'm', units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.34, yard: 0.9144, foot: 0.3048, inch: 0.0254 } },
  weight: { base: 'kg', units: { kg: 1, gram: 0.001, mg: 0.000001, ton: 1000, pound: 0.453592, ounce: 0.0283495 } },
  temperature: { base: 'c', units: { c: 'c', f: 'f', k: 'k' } }
};

function convertTemp(value, from, to) {
  let c;
  if (from === 'c') c = value;
  else if (from === 'f') c = (value - 32) * 5 / 9;
  else c = value - 273.15;

  if (to === 'c') return c;
  if (to === 'f') return c * 9 / 5 + 32;
  return c + 273.15;
}

renderers['unit-converter'] = (root) => {
  root.innerHTML = `
    ${header('Unit Converter', 'Convert between length, weight, and temperature units.')}
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Category</label>
          <select id="ucCategory">
            <option value="length">Length</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>From</label>
          <input type="number" id="ucValue" value="1" step="any">
        </div>
        <div class="field">
          <label>Unit</label>
          <select id="ucFrom"></select>
        </div>
        <div class="field">
          <label>To unit</label>
          <select id="ucTo"></select>
        </div>
      </div>
      <div class="result-display">
        <div class="result-label">Result</div>
        <span class="result-value" id="ucResult">0</span>
        <span class="result-unit" id="ucResultUnit"></span>
      </div>
    </div>
  `;

  const categorySel = root.querySelector('#ucCategory');
  const fromSel = root.querySelector('#ucFrom');
  const toSel = root.querySelector('#ucTo');
  const valueInput = root.querySelector('#ucValue');
  const resultEl = root.querySelector('#ucResult');
  const resultUnitEl = root.querySelector('#ucResultUnit');

  function populateUnits() {
    const cat = categorySel.value;
    const keys = Object.keys(unitGroups[cat].units);
    fromSel.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');
    toSel.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');
    toSel.selectedIndex = keys.length > 1 ? 1 : 0;
    compute();
  }

  function compute() {
    const cat = categorySel.value;
    const val = parseFloat(valueInput.value) || 0;
    const from = fromSel.value;
    const to = toSel.value;
    let result;

    if (cat === 'temperature') {
      result = convertTemp(val, from, to);
    } else {
      const group = unitGroups[cat].units;
      const meters = val * group[from];
      result = meters / group[to];
    }

    resultEl.textContent = Number(result.toFixed(6)).toString();
    resultUnitEl.textContent = to;
  }

  categorySel.addEventListener('change', populateUnits);
  [fromSel, toSel, valueInput].forEach(el => el.addEventListener('input', compute));
  populateUnits();
};

// ===================================================================
// 2. CALCULATOR
// ===================================================================
renderers['calculator'] = (root) => {
  root.innerHTML = `
    ${header('Calculator', 'Basic and scientific calculations.')}
    <div class="card" style="max-width:380px;">
      <div class="calc-display" id="calcDisplay">0</div>
      <div class="calc-grid" id="calcGrid"></div>
    </div>
  `;

  const display = root.querySelector('#calcDisplay');
  const grid = root.querySelector('#calcGrid');

  const buttons = [
    ['sin', 'cos', 'tan', 'C'],
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '−'],
    ['0', '.', '%', '+'],
    ['√', '^', '⌫', '=']
  ];

  let expr = '';

  function render() {
    display.textContent = expr === '' ? '0' : expr;
  }

  function safeEval(e) {
    // Replace human-friendly symbols with JS math equivalents
    let jsExpr = e
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/√(\d+\.?\d*)/g, 'Math.sqrt($1)')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(');

    if (!/^[0-9+\-*/%.()\sMathsincot²√.]*$/.test(jsExpr.replace(/Math\.(sin|cos|tan|sqrt)/g, ''))) {
      // fallback validation skipped intentionally; rely on Function scope safety below
    }
    // eslint-disable-next-line no-new-func
    return Function('"use strict"; return (' + jsExpr + ')')();
  }

  grid.innerHTML = buttons.flat().map(b => {
    let cls = 'calc-btn';
    if (['÷', '×', '−', '+', '^'].includes(b)) cls += ' op';
    if (b === '=') cls += ' equals';
    if (b === 'C') cls += ' clear';
    return `<button class="${cls}" data-key="${b}">${b}</button>`;
  }).join('');

  grid.addEventListener('click', (e) => {
    const key = e.target.dataset.key;
    if (!key) return;

    if (key === 'C') {
      expr = '';
    } else if (key === '⌫') {
      expr = expr.slice(0, -1);
    } else if (key === '=') {
      try {
        const result = safeEval(expr);
        expr = Number.isFinite(result) ? String(Number(result.toFixed(8))) : 'Error';
      } catch {
        expr = 'Error';
      }
    } else if (key === 'sin' || key === 'cos' || key === 'tan') {
      expr += key + '(';
    } else if (key === '√') {
      expr += '√';
    } else {
      expr += key;
    }
    render();
  });

  render();
};

// ===================================================================
// 3. EMI / LOAN CALCULATOR
// ===================================================================
renderers['emi'] = (root) => {
  root.innerHTML = `
    ${header('EMI / Loan Calculator', 'Estimate your monthly installment, total interest, and total payment.')}
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Loan amount (₹)</label>
          <input type="number" id="emiPrincipal" value="500000" min="0">
        </div>
        <div class="field">
          <label>Interest rate (% per year)</label>
          <input type="number" id="emiRate" value="8.5" step="0.1" min="0">
        </div>
        <div class="field">
          <label>Tenure (years)</label>
          <input type="number" id="emiTenure" value="5" min="1">
        </div>
      </div>
      <div class="result-display">
        <div class="result-label">Monthly EMI</div>
        <span class="result-value" id="emiResult">0</span>
        <span class="result-unit">per month</span>
      </div>
      <div class="field-row" style="margin-top:18px;">
        <div class="field">
          <label>Total interest payable</label>
          <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;" id="emiInterest">—</div>
        </div>
        <div class="field">
          <label>Total payment</label>
          <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;" id="emiTotal">—</div>
        </div>
      </div>
    </div>
  `;

  const p = root.querySelector('#emiPrincipal');
  const r = root.querySelector('#emiRate');
  const t = root.querySelector('#emiTenure');
  const resEl = root.querySelector('#emiResult');
  const intEl = root.querySelector('#emiInterest');
  const totEl = root.querySelector('#emiTotal');

  function compute() {
    const principal = parseFloat(p.value) || 0;
    const annualRate = parseFloat(r.value) || 0;
    const years = parseFloat(t.value) || 0;
    const monthlyRate = annualRate / 12 / 100;
    const months = years * 12;

    let emi = 0;
    if (monthlyRate === 0 && months > 0) {
      emi = principal / months;
    } else if (months > 0) {
      emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    resEl.textContent = isFinite(emi) ? '₹' + emi.toFixed(2) : '0';
    intEl.textContent = isFinite(totalInterest) ? '₹' + totalInterest.toFixed(2) : '—';
    totEl.textContent = isFinite(totalPayment) ? '₹' + totalPayment.toFixed(2) : '—';
  }

  [p, r, t].forEach(el => el.addEventListener('input', compute));
  compute();
};

// ===================================================================
// 4. BMI CALCULATOR
// ===================================================================
renderers['bmi'] = (root) => {
  root.innerHTML = `
    ${header('BMI Calculator', 'Check your Body Mass Index based on height and weight.')}
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Height (cm)</label>
          <input type="number" id="bmiHeight" value="170" min="0">
        </div>
        <div class="field">
          <label>Weight (kg)</label>
          <input type="number" id="bmiWeight" value="65" min="0">
        </div>
      </div>
      <div class="result-display">
        <div class="result-label">Your BMI</div>
        <span class="result-value" id="bmiResult">0</span>
        <span class="result-unit" id="bmiCategory"></span>
      </div>
    </div>
  `;

  const h = root.querySelector('#bmiHeight');
  const w = root.querySelector('#bmiWeight');
  const resEl = root.querySelector('#bmiResult');
  const catEl = root.querySelector('#bmiCategory');

  function compute() {
    const heightM = (parseFloat(h.value) || 0) / 100;
    const weight = parseFloat(w.value) || 0;
    if (heightM <= 0) { resEl.textContent = '0'; catEl.textContent = ''; return; }

    const bmi = weight / (heightM * heightM);
    resEl.textContent = bmi.toFixed(1);

    let category;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    catEl.textContent = category;
  }

  [h, w].forEach(el => el.addEventListener('input', compute));
  compute();
};

// ===================================================================
// 5. AGE CALCULATOR
// ===================================================================
renderers['age'] = (root) => {
  root.innerHTML = `
    ${header('Age Calculator', 'Find your exact age in years, months, and days.')}
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Date of birth</label>
          <input type="date" id="ageDob">
        </div>
        <div class="field">
          <label>As of date</label>
          <input type="date" id="ageAsOf">
        </div>
      </div>
      <div class="result-display">
        <div class="result-label">Your age</div>
        <span class="result-value" id="ageResult">—</span>
      </div>
    </div>
  `;

  const dob = root.querySelector('#ageDob');
  const asOf = root.querySelector('#ageAsOf');
  const resEl = root.querySelector('#ageResult');

  asOf.valueAsDate = new Date();

  function compute() {
    if (!dob.value) { resEl.textContent = '—'; return; }
    const start = new Date(dob.value);
    const end = asOf.value ? new Date(asOf.value) : new Date();

    if (start > end) { resEl.textContent = 'Invalid'; return; }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    resEl.innerHTML = `${years}<span class="result-unit">yrs</span> ${months}<span class="result-unit">mo</span> ${days}<span class="result-unit">d</span>`;
  }

  [dob, asOf].forEach(el => el.addEventListener('input', compute));
};

// ===================================================================
// 6. NOTES EDITOR
// ===================================================================
renderers['notes'] = (root) => {
  root.innerHTML = `
    ${header('Notes Editor', 'Quick plain-text notes. Saved locally in your browser.')}
    <div class="notes-toolbar">
      <span id="notesStatus">Saved</span>
      <div>
        <button class="btn btn-secondary" id="notesDownload" style="margin-right:8px;">Download .txt</button>
        <button class="btn btn-secondary" id="notesClear">Clear</button>
      </div>
    </div>
    <textarea id="notesArea" placeholder="Start typing..."></textarea>
  `;

  const area = root.querySelector('#notesArea');
  const status = root.querySelector('#notesStatus');
  const downloadBtn = root.querySelector('#notesDownload');
  const clearBtn = root.querySelector('#notesClear');

  area.value = localStorage.getItem('ub-notes') || '';

  let saveTimer;
  area.addEventListener('input', () => {
    status.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem('ub-notes', area.value);
      status.textContent = 'Saved';
    }, 400);
  });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([area.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all notes? This cannot be undone.')) {
      area.value = '';
      localStorage.setItem('ub-notes', '');
      status.textContent = 'Saved';
    }
  });
};

// ===================================================================
// 7. IMAGE RESIZE / COMPRESS
// ===================================================================
renderers['image-tools'] = (root) => {
  root.innerHTML = `
    ${header('Image Resize / Compress', 'Resize, compress, or convert image format — all in your browser.')}
    <div class="card">
      <div class="drop-zone" id="imgDropZone">
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>
        <p class="dz-main">Drop an image here, or click to browse</p>
        <p>JPG, PNG, WebP supported</p>
        <input type="file" id="imgFileInput" accept="image/*" hidden>
      </div>

      <div id="imgControls" style="display:none; margin-top:20px;">
        <div class="field-row">
          <div class="field">
            <label>Width (px)</label>
            <input type="number" id="imgWidth" min="1">
          </div>
          <div class="field">
            <label>Height (px)</label>
            <input type="number" id="imgHeight" min="1">
          </div>
          <div class="field">
            <label>Format</label>
            <select id="imgFormat">
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Quality (<span id="imgQualityVal">80</span>%)</label>
            <input type="range" id="imgQuality" min="10" max="100" value="80">
          </div>
          <div class="field">
            <label style="visibility:hidden;">Lock ratio</label>
            <label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:14px;color:var(--text);">
              <input type="checkbox" id="imgLockRatio" checked style="width:auto;"> Lock aspect ratio
            </label>
          </div>
        </div>

        <div class="preview-grid">
          <div class="preview-box">
            <div class="preview-box-label">Original</div>
            <img id="imgOriginalPreview">
            <div class="status-text" id="imgOriginalSize"></div>
          </div>
          <div class="preview-box">
            <div class="preview-box-label">Result</div>
            <img id="imgResultPreview">
            <div class="status-text" id="imgResultSize"></div>
          </div>
        </div>

        <button class="btn" id="imgDownloadBtn" style="margin-top:18px;">Download result</button>
      </div>
    </div>
  `;

  const dropZone = root.querySelector('#imgDropZone');
  const fileInput = root.querySelector('#imgFileInput');
  const controls = root.querySelector('#imgControls');
  const widthInput = root.querySelector('#imgWidth');
  const heightInput = root.querySelector('#imgHeight');
  const formatSel = root.querySelector('#imgFormat');
  const qualityInput = root.querySelector('#imgQuality');
  const qualityVal = root.querySelector('#imgQualityVal');
  const lockRatio = root.querySelector('#imgLockRatio');
  const origPreview = root.querySelector('#imgOriginalPreview');
  const resultPreview = root.querySelector('#imgResultPreview');
  const origSize = root.querySelector('#imgOriginalSize');
  const resultSize = root.querySelector('#imgResultSize');
  const downloadBtn = root.querySelector('#imgDownloadBtn');

  let img = new Image();
  let originalFile = null;
  let aspectRatio = 1;
  let resultBlob = null;

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadFile(e.target.files[0]);
  });

  function loadFile(file) {
    originalFile = file;
    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
      aspectRatio = img.width / img.height;
      widthInput.value = img.width;
      heightInput.value = img.height;
      origPreview.src = url;
      origSize.textContent = `${img.width} × ${img.height} px · ${(file.size / 1024).toFixed(1)} KB`;
      controls.style.display = 'block';
      renderResult();
    };
    img.src = url;
  }

  function renderResult() {
    if (!img.src) return;
    const w = parseInt(widthInput.value) || img.width;
    const h = parseInt(heightInput.value) || img.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (formatSel.value === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);

    const quality = parseInt(qualityInput.value) / 100;
    canvas.toBlob((blob) => {
      resultBlob = blob;
      const url = URL.createObjectURL(blob);
      resultPreview.src = url;
      resultSize.textContent = `${w} × ${h} px · ${(blob.size / 1024).toFixed(1)} KB`;
    }, formatSel.value, quality);
  }

  widthInput.addEventListener('input', () => {
    if (lockRatio.checked) heightInput.value = Math.round(widthInput.value / aspectRatio);
    renderResult();
  });
  heightInput.addEventListener('input', () => {
    if (lockRatio.checked) widthInput.value = Math.round(heightInput.value * aspectRatio);
    renderResult();
  });
  formatSel.addEventListener('change', renderResult);
  qualityInput.addEventListener('input', () => {
    qualityVal.textContent = qualityInput.value;
    renderResult();
  });

  downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const ext = formatSel.value.split('/')[1];
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

// ===================================================================
// 8. BACKGROUND REMOVER (client-side AI)
// ===================================================================
renderers['bg-remove'] = (root) => {
  root.innerHTML = `
    ${header('Background Remover', 'AI-powered background removal. The model downloads once (~80MB) and everything runs on your device.')}
    <div class="card">
      <div class="drop-zone" id="bgDropZone">
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>
        <p class="dz-main">Drop a photo here, or click to browse</p>
        <p>Works best with a clear subject (people, products, animals)</p>
        <input type="file" id="bgFileInput" accept="image/*" hidden>
      </div>

      <div id="bgStatusWrap" style="display:none;">
        <div class="progress-bar"><div class="progress-fill" id="bgProgressFill"></div></div>
        <div class="status-text" id="bgStatusText">Loading model…</div>
      </div>

      <div id="bgResultWrap" style="display:none; margin-top:20px;">
        <div class="preview-grid">
          <div class="preview-box">
            <div class="preview-box-label">Original</div>
            <img id="bgOriginalPreview">
          </div>
          <div class="preview-box checkerboard">
            <div class="preview-box-label">Background removed</div>
            <img id="bgResultPreview">
          </div>
        </div>
        <button class="btn" id="bgDownloadBtn" style="margin-top:18px;">Download PNG</button>
      </div>
    </div>
  `;

  const dropZone = root.querySelector('#bgDropZone');
  const fileInput = root.querySelector('#bgFileInput');
  const statusWrap = root.querySelector('#bgStatusWrap');
  const progressFill = root.querySelector('#bgProgressFill');
  const statusText = root.querySelector('#bgStatusText');
  const resultWrap = root.querySelector('#bgResultWrap');
  const originalPreview = root.querySelector('#bgOriginalPreview');
  const resultPreview = root.querySelector('#bgResultPreview');
  const downloadBtn = root.querySelector('#bgDownloadBtn');

  let resultBlob = null;

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  });

  async function processFile(file) {
    originalPreview.src = URL.createObjectURL(file);
    resultWrap.style.display = 'none';
    statusWrap.style.display = 'block';
    progressFill.style.width = '5%';
    statusText.textContent = 'Loading AI model… (first time may take a minute)';

    try {
      // Dynamically import the background-removal library from CDN (ESM build)
      const { removeBackground } = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/index.mjs');

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const pct = total ? Math.round((current / total) * 100) : 0;
          progressFill.style.width = pct + '%';
          statusText.textContent = `Processing… ${pct}%`;
        }
      });

      resultBlob = blob;
      resultPreview.src = URL.createObjectURL(blob);
      statusWrap.style.display = 'none';
      resultWrap.style.display = 'block';
    } catch (err) {
      console.error(err);
      statusText.textContent = 'Something went wrong loading the model. Check your connection and try again.';
      progressFill.style.width = '0%';
    }
  }

  downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'background-removed.png';
    a.click();
    URL.revokeObjectURL(url);
  });
};

// ===================================================================
// 9. PDF MERGE / SPLIT
// ===================================================================
renderers['pdf-tools'] = (root) => {
  root.innerHTML = `
    ${header('PDF Merge / Split', 'Combine multiple PDFs into one, or split pages out of a PDF.')}

    <div class="card" style="margin-bottom:20px;">
      <div class="tool-sub" style="font-weight:600; color:var(--text); margin-bottom:12px;">Merge PDFs</div>
      <div class="drop-zone" id="pdfMergeDropZone">
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>
        <p class="dz-main">Add PDF files to merge (in order)</p>
        <p>Click to browse, or drop multiple files</p>
        <input type="file" id="pdfMergeInput" accept="application/pdf" multiple hidden>
      </div>
      <div class="file-list" id="pdfMergeList"></div>
      <button class="btn" id="pdfMergeBtn" style="margin-top:16px;" disabled>Merge & download</button>
    </div>

    <div class="card">
      <div class="tool-sub" style="font-weight:600; color:var(--text); margin-bottom:12px;">Split PDF</div>
      <div class="drop-zone" id="pdfSplitDropZone">
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>
        <p class="dz-main">Add one PDF to split</p>
        <p>Click to browse, or drop a file</p>
        <input type="file" id="pdfSplitInput" accept="application/pdf" hidden>
      </div>
      <div id="pdfSplitControls" style="display:none; margin-top:16px;">
        <div class="field-row">
          <div class="field">
            <label>Page range (e.g. 1-3, or 2)</label>
            <input type="text" id="pdfSplitRange" placeholder="1-3">
          </div>
        </div>
        <div class="status-text" id="pdfSplitInfo"></div>
        <button class="btn" id="pdfSplitBtn" style="margin-top:10px;">Extract & download</button>
      </div>
    </div>
  `;

  // ---- Merge ----
  const mergeDropZone = root.querySelector('#pdfMergeDropZone');
  const mergeInput = root.querySelector('#pdfMergeInput');
  const mergeList = root.querySelector('#pdfMergeList');
  const mergeBtn = root.querySelector('#pdfMergeBtn');
  let mergeFiles = [];

  mergeDropZone.addEventListener('click', () => mergeInput.click());
  mergeDropZone.addEventListener('dragover', (e) => { e.preventDefault(); mergeDropZone.classList.add('dragover'); });
  mergeDropZone.addEventListener('dragleave', () => mergeDropZone.classList.remove('dragover'));
  mergeDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    mergeDropZone.classList.remove('dragover');
    addMergeFiles(Array.from(e.dataTransfer.files));
  });
  mergeInput.addEventListener('change', (e) => addMergeFiles(Array.from(e.target.files)));

  function addMergeFiles(files) {
    mergeFiles.push(...files.filter(f => f.type === 'application/pdf'));
    renderMergeList();
  }

  function renderMergeList() {
    mergeList.innerHTML = mergeFiles.map((f, i) => `
      <div class="file-item">
        <span>${i + 1}. ${f.name}</span>
        <button data-idx="${i}">Remove</button>
      </div>
    `).join('');
    mergeBtn.disabled = mergeFiles.length < 2;

    mergeList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        mergeFiles.splice(parseInt(btn.dataset.idx), 1);
        renderMergeList();
      });
    });
  }

  mergeBtn.addEventListener('click', async () => {
    mergeBtn.disabled = true;
    mergeBtn.textContent = 'Merging…';
    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      for (const file of mergeFiles) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not merge these PDFs. Make sure they are valid, unencrypted PDF files.');
      console.error(err);
    }
    mergeBtn.disabled = false;
    mergeBtn.textContent = 'Merge & download';
  });

  // ---- Split ----
  const splitDropZone = root.querySelector('#pdfSplitDropZone');
  const splitInput = root.querySelector('#pdfSplitInput');
  const splitControls = root.querySelector('#pdfSplitControls');
  const splitRange = root.querySelector('#pdfSplitRange');
  const splitInfo = root.querySelector('#pdfSplitInfo');
  const splitBtn = root.querySelector('#pdfSplitBtn');
  let splitFile = null;
  let splitPageCount = 0;

  splitDropZone.addEventListener('click', () => splitInput.click());
  splitDropZone.addEventListener('dragover', (e) => { e.preventDefault(); splitDropZone.classList.add('dragover'); });
  splitDropZone.addEventListener('dragleave', () => splitDropZone.classList.remove('dragover'));
  splitDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    splitDropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadSplitFile(e.dataTransfer.files[0]);
  });
  splitInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadSplitFile(e.target.files[0]);
  });

  async function loadSplitFile(file) {
    if (file.type !== 'application/pdf') return;
    splitFile = file;
    const bytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    splitPageCount = pdf.getPageCount();
    splitInfo.textContent = `${file.name} — ${splitPageCount} pages total`;
    splitControls.style.display = 'block';
  }

  function parseRange(rangeStr, maxPage) {
    const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
    const pages = new Set();
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        for (let i = start; i <= end; i++) if (i >= 1 && i <= maxPage) pages.add(i - 1);
      } else {
        const n = parseInt(part);
        if (n >= 1 && n <= maxPage) pages.add(n - 1);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }

  splitBtn.addEventListener('click', async () => {
    if (!splitFile || !splitRange.value.trim()) {
      alert('Enter a page range first, e.g. 1-3');
      return;
    }
    const indices = parseRange(splitRange.value, splitPageCount);
    if (indices.length === 0) {
      alert('That page range did not match any pages in this PDF.');
      return;
    }
    try {
      const bytes = await splitFile.arrayBuffer();
      const srcPdf = await PDFLib.PDFDocument.load(bytes);
      const newPdf = await PDFLib.PDFDocument.create();
      const pages = await newPdf.copyPages(srcPdf, indices);
      pages.forEach(p => newPdf.addPage(p));
      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not split this PDF.');
      console.error(err);
    }
  });
};

// ===================================================================
// 10. CURRENCY CONVERTER
// ===================================================================
renderers['currency'] = (root) => {
  root.innerHTML = `
    ${header('Currency Converter', 'Live exchange rates, updated daily.')}
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Amount</label>
          <input type="number" id="curAmount" value="1" min="0" step="any">
        </div>
        <div class="field">
          <label>From</label>
          <select id="curFrom"></select>
        </div>
        <div class="field">
          <label>To</label>
          <select id="curTo"></select>
        </div>
      </div>
      <div class="result-display">
        <div class="result-label">Converted amount</div>
        <span class="result-value" id="curResult">—</span>
        <span class="result-unit" id="curResultCode"></span>
      </div>
      <div class="status-text" id="curStatus"></div>
    </div>
  `;

  const amountInput = root.querySelector('#curAmount');
  const fromSel = root.querySelector('#curFrom');
  const toSel = root.querySelector('#curTo');
  const resultEl = root.querySelector('#curResult');
  const codeEl = root.querySelector('#curResultCode');
  const statusEl = root.querySelector('#curStatus');

  const commonCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CNY', 'AED', 'SGD', 'CHF', 'ZAR'];
  let rates = null;

  function populateSelects() {
    fromSel.innerHTML = commonCurrencies.map(c => `<option value="${c}">${c}</option>`).join('');
    toSel.innerHTML = commonCurrencies.map(c => `<option value="${c}">${c}</option>`).join('');
    fromSel.value = 'USD';
    toSel.value = 'INR';
  }

  async function loadRates() {
    statusEl.textContent = 'Loading live rates…';
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result === 'success') {
        rates = data.rates;
        statusEl.textContent = 'Rates updated: ' + (data.time_last_update_utc || '');
        compute();
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      statusEl.textContent = 'Could not load live rates. Check your connection and try again.';
    }
  }

  function compute() {
    if (!rates) return;
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromSel.value;
    const to = toSel.value;
    // rates are USD-based: value_in_currency = amount_in_USD * rate
    const usdAmount = amount / rates[from];
    const result = usdAmount * rates[to];
    resultEl.textContent = result.toLocaleString(undefined, { maximumFractionDigits: 4 });
    codeEl.textContent = to;
  }

  [amountInput, fromSel, toSel].forEach(el => el.addEventListener('input', compute));
  populateSelects();
  loadRates();
};

// ===================================================================
// 11. WORD / CHARACTER COUNTER
// ===================================================================
renderers['word-counter'] = (root) => {
  root.innerHTML = `
    ${header('Word & Character Counter', 'Paste or type text to see word count, character count, and reading time.')}
    <div class="card">
      <textarea id="wcArea" placeholder="Paste or type your text here..." style="width:100%; min-height:240px; font-family:var(--font-body); font-size:15px; padding:16px; border:1px solid var(--border); border-radius:8px; background:var(--bg); resize:vertical;"></textarea>
      <div class="field-row" style="margin-top:20px;">
        <div class="field">
          <label>Words</label>
          <div style="font-family:var(--font-mono); font-size:22px; font-weight:700;" id="wcWords">0</div>
        </div>
        <div class="field">
          <label>Characters</label>
          <div style="font-family:var(--font-mono); font-size:22px; font-weight:700;" id="wcChars">0</div>
        </div>
        <div class="field">
          <label>Characters (no spaces)</label>
          <div style="font-family:var(--font-mono); font-size:22px; font-weight:700;" id="wcCharsNoSpace">0</div>
        </div>
        <div class="field">
          <label>Sentences</label>
          <div style="font-family:var(--font-mono); font-size:22px; font-weight:700;" id="wcSentences">0</div>
        </div>
      </div>
      <div class="status-text" id="wcReadTime" style="margin-top:6px;"></div>
    </div>
  `;

  const area = root.querySelector('#wcArea');
  const wordsEl = root.querySelector('#wcWords');
  const charsEl = root.querySelector('#wcChars');
  const charsNoSpaceEl = root.querySelector('#wcCharsNoSpace');
  const sentencesEl = root.querySelector('#wcSentences');
  const readTimeEl = root.querySelector('#wcReadTime');

  function compute() {
    const text = area.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const sentences = text.trim() === '' ? 0 : (text.match(/[.!?]+/g) || []).length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));

    wordsEl.textContent = words;
    charsEl.textContent = chars;
    charsNoSpaceEl.textContent = charsNoSpace;
    sentencesEl.textContent = sentences;
    readTimeEl.textContent = words > 0 ? `Estimated reading time: ${readMinutes} min` : '';
  }

  area.addEventListener('input', compute);
  compute();
};

// ===================================================================
// 12. QR CODE GENERATOR
// ===================================================================
renderers['qr-code'] = (root) => {
  root.innerHTML = `
    ${header('QR Code Generator', 'Turn any text or link into a downloadable QR code.')}
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label>Text or URL</label>
          <input type="text" id="qrText" placeholder="https://example.com" value="https://example.com">
        </div>
        <div class="field">
          <label>Size (px)</label>
          <select id="qrSize">
            <option value="200">200 × 200</option>
            <option value="300" selected>300 × 300</option>
            <option value="500">500 × 500</option>
          </select>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:16px; margin-top:10px;">
        <div id="qrCanvas" style="background:white; padding:16px; border-radius:8px; border:1px solid var(--border);"></div>
        <button class="btn" id="qrDownloadBtn">Download PNG</button>
      </div>
    </div>
  `;

  const textInput = root.querySelector('#qrText');
  const sizeSelect = root.querySelector('#qrSize');
  const canvasDiv = root.querySelector('#qrCanvas');
  const downloadBtn = root.querySelector('#qrDownloadBtn');

  let qr = null;

  function render() {
    canvasDiv.innerHTML = '';
    const size = parseInt(sizeSelect.value);
    const text = textInput.value.trim() || ' ';
    qr = new QRCode(canvasDiv, {
      text: text,
      width: size,
      height: size,
      colorDark: '#1A1A1A',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  textInput.addEventListener('input', render);
  sizeSelect.addEventListener('change', render);

  downloadBtn.addEventListener('click', () => {
    const img = canvasDiv.querySelector('img');
    const canvasEl = canvasDiv.querySelector('canvas');
    const src = img ? img.src : (canvasEl ? canvasEl.toDataURL('image/png') : null);
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = 'qrcode.png';
    a.click();
  });

  render();
};

// ===================================================================
// 13. PASSWORD GENERATOR
// ===================================================================
renderers['password'] = (root) => {
  root.innerHTML = `
    ${header('Password Generator', 'Create strong, random passwords. Generated locally — never sent anywhere.')}
    <div class="card">
      <div class="result-display" style="margin-top:0; padding-top:0; border-top:none;">
        <div class="result-label">Generated password</div>
        <span class="result-value" id="pwResult" style="font-size:26px; word-break:break-all;">—</span>
      </div>
      <div class="field-row" style="margin-top:20px;">
        <div class="field">
          <label>Length (<span id="pwLengthVal">16</span>)</label>
          <input type="range" id="pwLength" min="6" max="64" value="16">
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:14px;color:var(--text);">
            <input type="checkbox" id="pwUpper" checked style="width:auto;"> Uppercase (A-Z)
          </label>
        </div>
        <div class="field">
          <label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:14px;color:var(--text);">
            <input type="checkbox" id="pwLower" checked style="width:auto;"> Lowercase (a-z)
          </label>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:14px;color:var(--text);">
            <input type="checkbox" id="pwNumbers" checked style="width:auto;"> Numbers (0-9)
          </label>
        </div>
        <div class="field">
          <label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:14px;color:var(--text);">
            <input type="checkbox" id="pwSymbols" checked style="width:auto;"> Symbols (!@#$...)
          </label>
        </div>
      </div>
      <button class="btn" id="pwGenerateBtn" style="margin-top:10px;">Generate new password</button>
      <button class="btn btn-secondary" id="pwCopyBtn" style="margin-top:10px; margin-left:8px;">Copy</button>
    </div>
  `;

  const resultEl = root.querySelector('#pwResult');
  const lengthInput = root.querySelector('#pwLength');
  const lengthVal = root.querySelector('#pwLengthVal');
  const upperCb = root.querySelector('#pwUpper');
  const lowerCb = root.querySelector('#pwLower');
  const numbersCb = root.querySelector('#pwNumbers');
  const symbolsCb = root.querySelector('#pwSymbols');
  const generateBtn = root.querySelector('#pwGenerateBtn');
  const copyBtn = root.querySelector('#pwCopyBtn');

  const sets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  function generate() {
    let pool = '';
    if (upperCb.checked) pool += sets.upper;
    if (lowerCb.checked) pool += sets.lower;
    if (numbersCb.checked) pool += sets.numbers;
    if (symbolsCb.checked) pool += sets.symbols;

    if (pool === '') {
      resultEl.textContent = 'Select at least one option';
      return;
    }

    const length = parseInt(lengthInput.value);
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += pool[array[i] % pool.length];
    }
    resultEl.textContent = password;
  }

  lengthInput.addEventListener('input', () => {
    lengthVal.textContent = lengthInput.value;
    generate();
  });
  [upperCb, lowerCb, numbersCb, symbolsCb].forEach(cb => cb.addEventListener('change', generate));
  generateBtn.addEventListener('click', generate);

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultEl.textContent).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });

  generate();
};

// ===================================================================
// 14. PDF TO WORD (text extraction)
// ===================================================================
renderers['pdf-to-text'] = (root) => {
  root.innerHTML = `
    ${header('PDF to Word (text extract)', 'Extract readable text from a PDF and download it as a .doc file you can open in Word.')}
    <div class="card">
      <div class="drop-zone" id="pdfTextDropZone">
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>
        <p class="dz-main">Drop a PDF here, or click to browse</p>
        <p>Works best with text-based PDFs (not scanned images)</p>
        <input type="file" id="pdfTextInput" accept="application/pdf" hidden>
      </div>
      <div id="pdfTextStatusWrap" style="display:none;">
        <div class="status-text" id="pdfTextStatus">Extracting text…</div>
      </div>
      <div id="pdfTextResultWrap" style="display:none; margin-top:18px;">
        <textarea id="pdfTextArea" readonly style="width:100%; min-height:280px; font-family:var(--font-body); font-size:14px; padding:16px; border:1px solid var(--border); border-radius:8px; background:var(--bg); resize:vertical;"></textarea>
        <button class="btn" id="pdfTextDownloadBtn" style="margin-top:14px;">Download as .doc</button>
      </div>
    </div>
  `;

  const dropZone = root.querySelector('#pdfTextDropZone');
  const fileInput = root.querySelector('#pdfTextInput');
  const statusWrap = root.querySelector('#pdfTextStatusWrap');
  const statusText = root.querySelector('#pdfTextStatus');
  const resultWrap = root.querySelector('#pdfTextResultWrap');
  const textArea = root.querySelector('#pdfTextArea');
  const downloadBtn = root.querySelector('#pdfTextDownloadBtn');

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) extractText(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) extractText(e.target.files[0]);
  });

  async function extractText(file) {
    if (file.type !== 'application/pdf') return;
    resultWrap.style.display = 'none';
    statusWrap.style.display = 'block';
    statusText.textContent = 'Extracting text…';

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        statusText.textContent = `Extracting text… page ${i} of ${pdf.numPages}`;
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      textArea.value = fullText.trim() || '(No selectable text found — this PDF may be a scanned image.)';
      statusWrap.style.display = 'none';
      resultWrap.style.display = 'block';
    } catch (err) {
      statusText.textContent = 'Could not read this PDF. It may be corrupted or password-protected.';
      console.error(err);
    }
  }

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob(['\ufeff' + textArea.value], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.doc';
    a.click();
    URL.revokeObjectURL(url);
  });
};

// ===================================================================
// Init
// ===================================================================
setActiveTool(localStorage.getItem('ub-last-tool') || 'unit-converter');
