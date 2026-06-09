// AP Presenter — SiteEye Live Artificial Person Briefing
// Phase 1: Joe (Lebanon) + Tony (Florida) — solo remote sessions

const TOTAL = 9;
let slide = 1;
let phase = 'idle'; // idle | presenting | qa
let chatHistory = [];
let pc = null, stream = null, dc = null, connecting = false;
let briefingDone = false;

const $ = id => document.getElementById(id);
const feed = $('ap-feed');
const phaseBadge = $('phase-badge');
const apPill = $('ap-pill');

// ---- Dots ----
const dotsEl = $('ppt-dots');
for (let i = 1; i <= TOTAL; i++) {
  const d = document.createElement('div');
  d.className = 'pdot' + (i === 1 ? ' on' : '');
  d.onclick = () => goSlide(i);
  dotsEl.appendChild(d);
}

function goSlide(n) {
  slide = Math.max(1, Math.min(TOTAL, n));
  document.querySelectorAll('.slide').forEach(s => s.classList.toggle('on', +s.dataset.n === slide));
  document.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('on', i + 1 === slide));
  $('ppt-count').textContent = `${slide} / ${TOTAL}`;
  // Animate bars on slide 2/4
  if (slide === 2 || slide === 4) requestAnimationFrame(() => {
    document.querySelectorAll('.slide.on .bar i').forEach(b => {
      const w = b.style.width;
      b.style.width = '0';
      requestAnimationFrame(() => { b.style.width = w; });
    });
  });
}

$('btn-prev').onclick = () => goSlide(slide - 1);
$('btn-next').onclick = () => goSlide(slide + 1);
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goSlide(slide + 1);
  if (e.key === 'ArrowLeft') goSlide(slide - 1);
});

// ---- Tabs (PowerPoint familiarity) ----
document.querySelectorAll('.ppt-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.ppt-tab').forEach(t => t.classList.remove('on'));
    tab.classList.add('on');
    const name = tab.dataset.tab;
    $('panel-slides').classList.toggle('on', name === 'slides');
    $('panel-ap').classList.toggle('on', name === 'ap');
    $('panel-access').classList.toggle('on', name === 'access');
  };
});

// ---- Slide sync from AI ----
const KEYS = {
  1: ['intro', 'what is', 'siteeye', 'welcome'],
  2: ['problem', 'why', "can't be"],
  3: ['how', 'works', 'steps', 'deploy'],
  4: ['hardware', 'kit', 'camera', 'mast', 'cost'],
  5: ['commercial', 'pricing', 'basic', 'pro', 'price'],
  6: ['residential', 'pool', 'party', 'parent', 'park'],
  7: ['market', 'who', 'buy', 'contractor'],
  8: ['future', 'roadmap', 'coming'],
  9: ['question', 'q&a', 'anything', 'complete']
};

function syncSlide(text) {
  const t = text.toLowerCase();
  const m = text.match(/\[SLIDE:(\d+)\]/);
  if (m) { goSlide(+m[1]); if (+m[1] === 9) onBriefingComplete(); return; }
  for (const [n, words] of Object.entries(KEYS)) {
    if (words.some(w => t.includes(w))) { goSlide(+n); if (+n === 9) onBriefingComplete(); return; }
  }
}

function msg(from, text, you = false) {
  const el = document.createElement('div');
  el.className = 'ap-msg' + (you ? ' you' : '');
  el.innerHTML = `<span class="ap-from">${from}</span><p>${esc(text)}</p>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setPhase(p) {
  phase = p;
  document.body.classList.remove('phase-live', 'phase-qa');
  if (p === 'presenting') { document.body.classList.add('phase-live'); phaseBadge.textContent = 'Presenting'; apPill.textContent = 'Presenting'; }
  else if (p === 'qa') { document.body.classList.add('phase-qa'); phaseBadge.textContent = 'Q&A Open'; apPill.textContent = 'Q&A'; }
  else { phaseBadge.textContent = 'Ready'; apPill.textContent = 'Ready'; }
}

function onBriefingComplete() {
  if (briefingDone) return;
  briefingDone = true;
  $('btn-qa').disabled = false;
  msg('AxonAI', 'Briefing complete. Click "Open Q&A — Your Turn" or just start asking.');
}

// ---- Gate ----
$('gate-enter').onclick = () => {
  $('gate').classList.add('hidden');
  // Switch to AxonAI tab briefly so user sees AP
  document.querySelector('[data-tab="ap"]').click();
  msg('AxonAI', 'Click "Start Presentation" when you\'re ready. I\'ll walk you through all 9 slides.');
};

// ---- Voice ----
async function disconnect() {
  if (dc) { try { dc.close(); } catch {} dc = null; }
  if (pc) { try { pc.close(); } catch {} pc = null; }
  if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch {} stream = null; }
  connecting = false;
  setPhase('idle');
  $('btn-briefing').textContent = '▶ Start Presentation';
}

async function connectVoice(mode) {
  if (connecting) return;
  if (pc) await disconnect();
  connecting = true;
  $('btn-briefing').textContent = 'Connecting…';

  try {
    const r = await fetch(`/session?mode=${mode}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Connection failed');

    pc = new RTCPeerConnection();
    const audio = document.createElement('audio');
    audio.autoplay = true;
    pc.ontrack = e => { if (audio.srcObject !== e.streams[0]) audio.srcObject = e.streams[0]; };

    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      setPhase(mode === 'qa' ? 'qa' : 'presenting');
      $('btn-briefing').textContent = '■ Stop';
      dc.send(JSON.stringify({ type: 'response.create', response: { modalities: ['audio', 'text'] } }));
    };
    dc.onmessage = e => { try { onVoiceEvent(JSON.parse(e.data)); } catch {} };

    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(stream.getTracks()[0]);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = data.model || 'gpt-realtime';
    const sdp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: 'POST', body: offer.sdp,
      headers: { Authorization: 'Bearer ' + data.client_secret.value, 'Content-Type': 'application/sdp' }
    });
    if (!sdp.ok) throw new Error('Voice handshake failed');
    await pc.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
    connecting = false;
  } catch (err) {
    msg('AxonAI', err.message || 'Voice unavailable — use text below.');
    await disconnect();
  }
}

function onVoiceEvent(ev) {
  if (ev.type === 'response.audio_transcript.done' && ev.transcript) {
    const clean = ev.transcript.replace(/\[SLIDE:\d+\]/g, '').trim();
    if (clean) msg('AxonAI', clean);
    syncSlide(ev.transcript);
  }
  if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) {
    msg('You', ev.transcript, true);
  }
}

$('btn-briefing').onclick = async () => {
  if (pc) { await disconnect(); return; }
  document.querySelector('[data-tab="slides"]').click();
  goSlide(1);
  briefingDone = false;
  $('btn-qa').disabled = true;
  await connectVoice('briefing');
};

$('btn-qa').onclick = async () => {
  await disconnect();
  goSlide(9);
  document.querySelector('[data-tab="ap"]').click();
  await connectVoice('qa');
  msg('AxonAI', 'Q&A is open — ask me anything about SiteEye Live.');
};

// ---- Text chat (works anytime — great for Tony/Joe remote) ----
async function sendText() {
  const text = $('ap-input').value.trim();
  if (!text) return;
  $('ap-input').value = '';
  msg('You', text, true);
  chatHistory.push({ role: 'user', content: text });
  syncSlide(text);
  const load = msg('AxonAI', '…');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory })
    });
    const data = await r.json();
    load.remove();
    const reply = data.reply || 'No response.';
    msg('AxonAI', reply);
    chatHistory.push({ role: 'assistant', content: reply });
    syncSlide(reply);
    if (briefingDone || slide === 9) setPhase('qa');
  } catch {
    load.remove();
    msg('AxonAI', 'Connection error — check your network.');
  }
}

$('ap-send').onclick = sendText;
$('ap-input').onkeydown = e => { if (e.key === 'Enter') sendText(); };

// ---- Early access ----
$('access-form').onsubmit = async e => {
  e.preventDefault();
  $('a-msg').textContent = 'Sending…';
  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: $('a-name').value,
        email: $('a-email').value,
        phone: $('a-phone').value,
        message: 'Early access — AP Briefing'
      })
    });
    $('a-msg').textContent = (await r.json()).ok ? '✓ Got it.' : 'Error.';
  } catch { $('a-msg').textContent = 'Error.'; }
};
