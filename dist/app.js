(() => {
  const STORAGE_KEY = 'picture-diary-365-v1';
  const defaultDate = new Date().toISOString().slice(0, 10);
  const initial = { current: 0, cover: { image: '', title: 'わたしの<br><span>絵日記</span>', subtitle: '写真とことばでつづる、<br>365日。', name: 'YOUR NAME' }, entries: {} };
  let state = load();
  let editing = false;
  let recognition = null;

  const $ = (id) => document.getElementById(id);
  const coverPage = $('coverPage'), entryPage = $('entryPage');

  function load() { try { return { ...initial, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return initial; } }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('saveState').textContent = '保存しました'; setTimeout(() => $('saveState').textContent = '自動保存されます', 1300); updateProgress(); }
  function currentEntry() { const i = state.current; state.entries[i] ||= { date: i === 1 ? defaultDate : '', text: '', image: '' }; return state.entries[i]; }
  function showPage(index) {
    state.current = Math.max(0, Math.min(365, index));
    coverPage.classList.toggle('hidden', state.current !== 0); entryPage.classList.toggle('hidden', state.current === 0);
    $('dayLabel').textContent = state.current === 0 ? '表紙' : `DAY ${String(state.current).padStart(2, '0')}`;
    $('footerPage').textContent = state.current === 0 ? 'COVER' : `${String(state.current).padStart(2, '0')} / 365`;
    $('footerHint').textContent = state.current === 0 ? '表紙からはじめよう' : '今日のページを残そう';
    if (state.current > 0) renderEntry(); else renderCover();
    $('prevButton').disabled = state.current === 0; $('nextButton').textContent = state.current === 365 ? '✓' : '→';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderCover() { $('coverTitle').innerHTML = state.cover.title; $('coverSubtitle').innerHTML = state.cover.subtitle; $('coverName').textContent = state.cover.name; setImage($('coverDrop'), state.cover.image); }
  function renderEntry() { const e = currentEntry(); $('entryNumber').textContent = String(state.current).padStart(2, '0'); $('dateInput').value = e.date || ''; $('entryText').value = e.text || ''; setImage($('entryDrop'), e.image); }
  function setImage(zone, src) { zone.classList.toggle('has-image', !!src); const img = zone.querySelector('img'); if (img) img.src = src || ''; }
  function readImage(file, callback) { if (!file || !file.type.startsWith('image/')) return toast('画像ファイルを選んでください'); if (file.size > 8 * 1024 * 1024) return toast('画像は8MB以内にしてください'); const reader = new FileReader(); reader.onload = () => callback(reader.result); reader.readAsDataURL(file); }
  function attachImage(input, zone, save) { input.addEventListener('change', () => readImage(input.files[0], src => { save(src); setImage(zone, src); persist(); toast('写真を保存しました'); })); zone.addEventListener('click', () => input.click()); ['dragenter','dragover'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.add('dragging'); })); ['dragleave','drop'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.remove('dragging'); })); zone.addEventListener('drop', e => readImage(e.dataTransfer.files[0], src => { save(src); setImage(zone, src); persist(); toast('写真を保存しました'); })); }
  function updateProgress() { const written = Object.values(state.entries).filter(e => e && (e.text?.trim() || e.image)).length; $('progressText').textContent = `${written} / 365 日`; $('progressBar').style.width = `${Math.min(100, written / 365 * 100)}%`; }
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
  function setEditing(value) { editing = value; $('editToggle').textContent = editing ? '編集を終了' : '編集する'; [$('coverTitle'), $('coverSubtitle'), $('coverName')].forEach(el => el.contentEditable = editing); if (editing) toast('表紙の文字をクリックして編集できます'); }
  function plainCoverText(value) { const box = document.createElement('div'); box.innerHTML = value || ''; return box.textContent || ''; }
  function buildPrintBook() {
    const book = $('printAll'); book.innerHTML = '';
    const cover = document.createElement('article'); cover.className = 'print-page print-cover';
    const title = document.createElement('h1'); title.textContent = plainCoverText(state.cover.title); cover.append(title);
    const subtitle = document.createElement('p'); subtitle.textContent = plainCoverText(state.cover.subtitle); cover.append(subtitle);
    const name = document.createElement('p'); name.textContent = state.cover.name || ''; cover.append(name);
    if (state.cover.image) { const img = document.createElement('img'); img.src = state.cover.image; img.alt = '表紙の写真'; cover.append(img); }
    book.append(cover);
    for (let i = 1; i <= 365; i++) { const e = state.entries[i] || {}; const page = document.createElement('article'); page.className = 'print-page print-entry';
      const heading = document.createElement('h2'); heading.textContent = `DAY ${String(i).padStart(2, '0')} / 365`; page.append(heading);
      const date = document.createElement('div'); date.className = 'print-date'; date.textContent = e.date || '日付未入力'; page.append(date);
      if (e.image) { const img = document.createElement('img'); img.src = e.image; img.alt = `DAY ${i}の写真`; page.append(img); } else { const empty = document.createElement('div'); empty.className = 'print-placeholder'; page.append(empty); }
      const label = document.createElement('h3'); label.textContent = '今日のできごと'; page.append(label);
      const text = document.createElement('p'); text.textContent = e.text || ''; page.append(text); book.append(page); }
  }

  $('prevButton').addEventListener('click', () => { showPage(state.current - 1); persist(); }); $('nextButton').addEventListener('click', () => { showPage(state.current === 365 ? 0 : state.current + 1); persist(); });
  $('editToggle').addEventListener('click', () => setEditing(!editing));
  $('printButton').addEventListener('click', () => { toast('印刷ダイアログから「PDFに保存」を選べます'); setTimeout(() => window.print(), 450); });
  $('printYearButton').addEventListener('click', () => { buildPrintBook(); toast('1年分のPDF印刷ページを準備しています'); setTimeout(() => window.print(), 650); });
  $('dateInput').addEventListener('input', e => { currentEntry().date = e.target.value; persist(); }); $('entryText').addEventListener('input', e => { currentEntry().text = e.target.value; persist(); });
  [$('coverTitle'), $('coverSubtitle'), $('coverName')].forEach((el, i) => el.addEventListener('input', () => { state.cover[['title','subtitle','name'][i]] = i < 2 ? el.innerHTML : el.textContent; persist(); }));
  attachImage($('coverInput'), $('coverDrop'), src => state.cover.image = src); attachImage($('entryInput'), $('entryDrop'), src => currentEntry().image = src);
  function attachRemoveImage(zone, clear) { zone.querySelector('.remove-image').addEventListener('click', e => { e.stopPropagation(); clear(); setImage(zone, ''); persist(); toast('画像を削除しました'); }); }
  attachRemoveImage($('coverDrop'), () => state.cover.image = ''); attachRemoveImage($('entryDrop'), () => currentEntry().image = '');
  $('voiceButton').addEventListener('click', () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) return toast('このブラウザは音声入力に対応していません'); if (recognition) { recognition.stop(); return; } const voiceBaseText = $('entryText').value; recognition = new SpeechRecognition(); recognition.lang = 'ja-JP'; recognition.interimResults = true; recognition.continuous = false; $('voiceButton').classList.add('listening'); $('voiceStatus').textContent = '聞き取り中…'; recognition.onresult = e => { const transcript = [...e.results].map(r => r[0].transcript).join(''); const nextText = `${voiceBaseText}${transcript}`; $('entryText').value = nextText; currentEntry().text = nextText; }; recognition.onend = () => { recognition = null; $('voiceButton').classList.remove('listening'); $('voiceStatus').textContent = '音声入力を反映しました'; persist(); }; recognition.onerror = () => { recognition = null; $('voiceButton').classList.remove('listening'); $('voiceStatus').textContent = '音声入力を開始できませんでした'; }; recognition.start(); });
  renderCover(); showPage(state.current); updateProgress();
})();

