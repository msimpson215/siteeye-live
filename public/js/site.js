// SiteEye Live — visual deck + Axon

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80',
    title: 'See your job site from your phone.',
    line: 'A camera on a pole. Cell built in. Live video — from anywhere.',
    lead: 'SiteEye Live puts eyes where you can\'t be.',
    points: [
      '360° camera on a telescoping pole — 12 to 15 feet up',
      'Connects over cell service — no Wi-Fi at the site',
      'Watch on your phone, tablet, or office computer'
    ],
    axon: 'This is the big idea — you\'re not there, but you can still see everything.'
  },
  {
    image: 'https://images.unsplash.com/photo-1576013551627-0ccacbf04b08?w=1200&q=80',
    title: 'Can\'t be there? Still see it.',
    line: 'Contractors on multiple sites. Parents at a pool party checking from the kitchen.',
    lead: 'Commercial crews and families — same peace of mind.',
    points: [
      'Contractors: know the crew is working without driving there',
      'Parents: pool parties, backyard events, park birthdays',
      'Other parents can check in remotely too'
    ],
    axon: 'Don — imagine your kid\'s pool party. You\'re inside making food but you can still see the pool on your phone.'
  },
  {
    image: 'https://images.unsplash.com/photo-1581094794329-c8142f3836b5?w=1200&q=80',
    title: 'Set it up in minutes.',
    line: 'No tools. No IT department. Pole up, it finds cell signal, you\'re watching.',
    lead: 'Three steps — that\'s the whole thing.',
    points: [
      '1 — Arrive and set the pole up (minutes)',
      '2 — It connects to cell service automatically',
      '3 — Open the app and watch live'
    ],
    axon: 'Nobody needs to be tech-savvy. If you can use a phone, you can use this.'
  },
  {
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
    title: 'Watch live. Anywhere.',
    line: 'Office, truck, couch — same live view of the site or the backyard.',
    lead: 'Your phone becomes a window.',
    points: [
      'Works on iPhone, Android, or web browser',
      'Battery runs a full workday on the pole',
      'Pack it up and move to the next site'
    ],
    axon: 'The whole point is freedom — you\'re not tied to being on location.'
  },
  {
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    title: 'Simple pricing.',
    line: 'Contractor kits — monthly service or buy it outright. Ask Axon for your numbers.',
    lead: 'Basic for most crews. Pro for serious operations.',
    points: [
      'Basic — about $89/month plus setup, or ~$2,000 to buy',
      'Pro — about $119/month, more hardware and support',
      'Residential options coming — same idea, simpler package'
    ],
    axon: 'Ask me what Basic vs Pro means for your situation — I\'ll keep it simple.'
  }
];

let idx = 0;
let history = [];
let pc = null, stream = null, dc = null, connecting = false;

const chat = document.getElementById('axon-chat');
const talkBtn = document.getElementById('talk-btn');
const filmstrip = document.getElementById('filmstrip');

// Build filmstrip thumbnails
SLIDES.forEach((s, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb' + (i === 0 ? ' on' : '');
  btn.innerHTML = `<img src="${s.image.replace('1200', '200')}" alt=""/><span class="thumb-num">${i + 1}</span>`;
  btn.onclick = () => go(i);
  filmstrip.appendChild(btn);
});

function go(n) {
  idx = Math.max(0, Math.min(SLIDES.length - 1, n));
  const s = SLIDES[idx];

  document.getElementById('hero-img').src = s.image;
  document.getElementById('hero-img').alt = s.title;
  document.getElementById('hero-title').textContent = s.title;
  document.getElementById('hero-line').textContent = s.line;
  document.getElementById('slide-tag').textContent = `Slide ${idx + 1}`;
  document.getElementById('slide-num').textContent = `${idx + 1} / ${SLIDES.length}`;
  document.getElementById('progress-fill').style.width = `${((idx + 1) / SLIDES.length) * 100}%`;

  document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('on', i === idx));
  document.getElementById('btn-back').disabled = idx === 0;
  document.getElementById('btn-fwd').textContent = idx === SLIDES.length - 1 ? '✓' : '▶';

  // re-trigger slide animation
  const frame = document.getElementById('slide-frame');
  frame.style.animation = 'none';
  frame.offsetHeight;
  frame.style.animation = '';

  // subtle Axon nudge per slide (once)
  if (s.axon && !s._shown) {
    s._shown = true;
    bubble(s.axon, 'them');
  }
}

document.getElementById('btn-back').onclick = () => go(idx - 1);
document.getElementById('btn-fwd').onclick = () => { if (idx < SLIDES.length - 1) go(idx + 1); };

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').hidden === false) {
    if (e.key === 'Escape') closeLightbox();
    return;
  }
  if (e.key === 'ArrowRight') go(idx + 1);
  if (e.key === 'ArrowLeft') go(idx - 1);
});

// Lightbox
const lb = document.getElementById('lightbox');

function openLightbox() {
  const s = SLIDES[idx];
  document.getElementById('lb-img').src = s.image;
  document.getElementById('lb-title').textContent = s.title;
  document.getElementById('lb-lead').textContent = s.lead;
  const ul = document.getElementById('lb-points');
  ul.innerHTML = s.points.map(p => `<li>${esc(p)}</li>`).join('');
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lb.hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('hero-hit').onclick = openLightbox;
document.getElementById('lb-x').onclick = closeLightbox;
document.getElementById('lb-close').onclick = closeLightbox;

go(0);

// ---- Axon chat ----
function bubble(text, who = 'them') {
  const el = document.createElement('div');
  el.className = `bubble ${who}`;
  el.innerHTML = who === 'them' ? esc(text) : esc(text);
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function sendText() {
  const input = document.getElementById('type-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  bubble(text, 'you');
  history.push({ role: 'user', content: text });
  const wait = bubble('…');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history })
    });
    const data = await r.json();
    wait.remove();
    bubble(data.reply || 'Try again.', 'them');
    history.push({ role: 'assistant', content: data.reply });
  } catch {
    wait.remove();
    bubble('Connection problem.', 'them');
  }
}

document.getElementById('type-send').onclick = sendText;
document.getElementById('type-input').onkeydown = e => { if (e.key === 'Enter') sendText(); };

async function stopVoice() {
  if (dc) { try { dc.close(); } catch {} dc = null; }
  if (pc) { try { pc.close(); } catch {} pc = null; }
  if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch {} stream = null; }
  talkBtn.textContent = 'Talk to Axon';
  talkBtn.classList.remove('live');
  connecting = false;
}

async function startVoice() {
  if (pc || connecting) { await stopVoice(); return; }
  connecting = true;
  talkBtn.textContent = 'Connecting…';
  try {
    const r = await fetch('/session');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Could not connect');
    pc = new RTCPeerConnection();
    const audio = document.createElement('audio');
    audio.autoplay = true;
    pc.ontrack = e => { if (audio.srcObject !== e.streams[0]) audio.srcObject = e.streams[0]; };
    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      talkBtn.textContent = 'Stop';
      talkBtn.classList.add('live');
      dc.send(JSON.stringify({ type: 'response.create', response: { modalities: ['audio', 'text'] } }));
    };
    dc.onmessage = e => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === 'response.audio_transcript.done' && ev.transcript) bubble(ev.transcript.trim(), 'them');
        if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) bubble(ev.transcript, 'you');
      } catch {}
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
    connecting = false;
  } catch (err) {
    bubble(err.message || 'Use text instead.', 'them');
    await stopVoice();
  }
}

talkBtn.onclick = startVoice;

document.getElementById('contact-form').onsubmit = async e => {
  e.preventDefault();
  const msg = document.getElementById('c-msg');
  msg.textContent = 'Sending…';
  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('c-name').value,
        phone: document.getElementById('c-phone').value,
        email: document.getElementById('c-email').value
      })
    });
    msg.textContent = (await r.json()).ok ? 'Thanks — we\'ll reach out.' : 'Error.';
  } catch { msg.textContent = 'Error.'; }
};
