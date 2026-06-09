// SiteEye Live — AI Briefing client

const TOTAL = 9;
let slide = 1;
let chatHistory = [];
let pc = null, stream = null, dc = null, starting = false;

const feed = document.getElementById('axon-feed');
const state = document.getElementById('axon-state');
const btnStart = document.getElementById('btn-start');
const ask = document.getElementById('ask');
const dotsEl = document.getElementById('dots');

// Build dots
for (let i = 1; i <= TOTAL; i++) {
  const d = document.createElement('div');
  d.className = 'dot' + (i === 1 ? ' on' : '');
  d.addEventListener('click', () => go(i));
  dotsEl.appendChild(d);
}

function go(n) {
  slide = Math.max(1, Math.min(TOTAL, n));
  document.querySelectorAll('.slide').forEach(s =>
    s.classList.toggle('active', +s.dataset.slide === slide));
  document.querySelectorAll('.dot').forEach((d, i) =>
    d.classList.toggle('on', i + 1 === slide));
}

document.getElementById('prev').onclick = () => go(slide - 1);
document.getElementById('next').onclick = () => go(slide + 1);
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(slide + 1);
  if (e.key === 'ArrowLeft') go(slide - 1);
});

const KEYWORDS = {
  1: ['overview', 'what is', 'siteeye', 'intro'],
  2: ['problem', 'why'],
  3: ['how', 'works', 'steps', 'deploy'],
  4: ['hardware', 'kit', 'camera', 'mast', 'battery'],
  5: ['commercial', 'pricing', 'basic', 'pro', 'price'],
  6: ['residential', 'pool', 'parent', 'party', 'home'],
  7: ['who', 'market', 'buy', 'contractor'],
  8: ['future', 'roadmap', 'ai feature'],
  9: ['question', 'contact', 'early access']
};

function matchSlide(text) {
  const t = text.toLowerCase();
  for (const [n, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => t.includes(w))) return +n;
  }
  const m = text.match(/\[SLIDE:(\d+)\]/);
  if (m) return +m[1];
  return null;
}

function say(who, text, cls = '') {
  const el = document.createElement('div');
  el.className = `feed-item ${cls}`;
  el.innerHTML = `<span class="who">${who}</span><p>${esc(text)}</p>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function sync(text) {
  const n = matchSlide(text);
  if (n) go(n);
}

// ---- Text chat ----
async function sendText() {
  const text = ask.value.trim();
  if (!text) return;
  ask.value = '';
  say('You', text, 'you');
  chatHistory.push({ role: 'user', content: text });
  sync(text);
  const load = say('AxonAI', '…');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory })
    });
    const data = await r.json();
    load.remove();
    const reply = data.reply || 'No response.';
    say('AxonAI', reply);
    chatHistory.push({ role: 'assistant', content: reply });
    sync(reply);
  } catch {
    load.remove();
    say('AxonAI', 'Connection error.');
  }
}

document.getElementById('send').onclick = sendText;
ask.onkeydown = e => { if (e.key === 'Enter') sendText(); };

// ---- Voice briefing ----
async function stopVoice() {
  if (dc) { try { dc.close(); } catch {} dc = null; }
  if (pc) { try { pc.close(); } catch {} pc = null; }
  if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch {} stream = null; }
  document.body.classList.remove('live');
  starting = false;
  btnStart.textContent = 'Start Briefing';
  btnStart.classList.remove('off');
  state.textContent = 'Ready';
}

async function startVoice() {
  if (pc || starting) { await stopVoice(); return; }
  starting = true;
  btnStart.textContent = 'Connecting…';
  state.textContent = 'Connecting';

  try {
    const r = await fetch('/session');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Failed');

    pc = new RTCPeerConnection();
    const audio = document.createElement('audio');
    audio.autoplay = true;
    pc.ontrack = e => { if (audio.srcObject !== e.streams[0]) audio.srcObject = e.streams[0]; };

    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      document.body.classList.add('live');
      btnStart.textContent = 'End Briefing';
      btnStart.classList.add('off');
      state.textContent = 'Live';
      dc.send(JSON.stringify({ type: 'response.create', response: { modalities: ['audio', 'text'] } }));
    };
    dc.onmessage = e => {
      try { handleEvent(JSON.parse(e.data)); } catch {}
    };

    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(stream.getTracks()[0]);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = data.model || 'gpt-realtime';
    const sdp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: 'POST', body: offer.sdp,
      headers: { Authorization: 'Bearer ' + data.client_secret.value, 'Content-Type': 'application/sdp' }
    });
    if (!sdp.ok) throw new Error('Voice failed');
    await pc.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
    starting = false;
  } catch (err) {
    say('AxonAI', err.message || 'Voice unavailable — use text.');
    await stopVoice();
  }
}

function handleEvent(ev) {
  if (ev.type === 'response.audio_transcript.done' && ev.transcript) {
    say('AxonAI', ev.transcript.replace(/\[SLIDE:\d+\]/g, '').trim());
    sync(ev.transcript);
  }
  if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) {
    say('You', ev.transcript, 'you');
  }
}

btnStart.onclick = startVoice;

// Lead form
document.getElementById('lead-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('lead-msg');
  const name = document.getElementById('lead-name').value;
  const email = document.getElementById('lead-email').value;
  if (!name || !email) { msg.textContent = 'Name + email required.'; return; }
  msg.textContent = 'Sending…';
  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message: 'Early access from briefing' })
    });
    msg.textContent = (await r.json()).ok ? '✓ We\'ll be in touch.' : 'Error.';
  } catch { msg.textContent = 'Error.'; }
});
