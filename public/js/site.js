// SiteEye Live — slides (use YOUR photos in /public/images/)

const SLIDES = [
  {
    image: '/images/asphalt.png',
    fallback: 'camera',
    title: 'Asphalt & sealcoating.',
    line: 'Watch the paving crew from the office — no drive-by check.',
    lead: 'SiteEye Live for asphalt and paving jobs.',
    points: [
      'See progress on the road without sitting in traffic',
      '360° live view on cell — no Wi-Fi at the site',
      'Move the pole to the next stretch when you wrap'
    ],
    axon: 'Asphalt crews run multiple jobs. This keeps eyes on every site.'
  },
  {
    image: '/images/roofing.png',
    fallback: 'camera',
    title: 'Roofing.',
    line: 'Know the crew is on the roof — and still working — from your phone.',
    lead: 'Built for roofing contractors who can\'t be on every house.',
    points: [
      'Live view of the roof and yard',
      'Tamper awareness while gear is set up',
      'Works on any device'
    ],
    axon: 'Roofing spreads across neighborhoods. SiteEye covers the ones you\'re not at.'
  },
  {
    image: '/images/concrete.png',
    fallback: 'setup',
    title: 'Concrete.',
    line: 'Forms, pours, and curing — check in without rolling the truck.',
    lead: 'Concrete crews get remote eyes on the pour.',
    points: [
      'Watch pour day from the office or another job',
      'Document the site with live video',
      'Pack up and move to the next foundation'
    ],
    axon: 'Pour day is busy. You can still see it live if you\'re elsewhere.'
  },
  {
    image: '/images/excavation.png',
    fallback: 'setup',
    title: 'Excavation.',
    line: 'Heavy equipment sites — see activity without being on the dirt.',
    lead: 'Excavation and earthwork, monitored remotely.',
    points: [
      'Eyes on dig sites across town',
      'Cellular — no job-site Wi-Fi needed',
      'Deploys in minutes'
    ],
    axon: 'Excavators move. So should your camera — SiteEye packs up with the job.'
  },
  {
    image: '/images/demolition.png',
    fallback: 'camera',
    title: 'Demolition.',
    line: 'High-risk sites. You still need visibility when you can\'t stand next to the machine.',
    lead: 'Demolition and tear-down visibility.',
    points: [
      'Remote live view of the tear-down',
      'Safer oversight from a distance',
      'Same kit — pole, camera, cell'
    ],
    axon: 'Demolition is loud and messy. Watch from a safer spot.'
  },
  {
    image: '/images/landscaping.png',
    fallback: 'pool',
    title: 'Landscaping.',
    line: 'Crews on residential and commercial grounds — check without the drive.',
    lead: 'Landscaping and grounds crews.',
    points: [
      'See multiple properties in one day',
      'Live phone view for owners or GCs',
      'Quick setup, quick teardown'
    ],
    axon: 'Landscapers bounce between yards. SiteEye stays pointed at the job.'
  },
  {
    image: '/images/painting.png',
    fallback: 'phone',
    title: 'Painting.',
    line: 'Interior or exterior crews — progress you can see from anywhere.',
    lead: 'Painting contractors get live site visibility.',
    points: [
      'Check progress between walkthroughs',
      'Works indoors or on the exterior',
      'Share the view with the GC if needed'
    ],
    axon: 'Paint days drag. A quick glance on the phone beats a wasted trip.'
  },
  {
    image: '/images/pressure_washing.png',
    fallback: 'kit',
    title: 'Pressure washing.',
    line: 'Before-and-after work you can oversee without standing in the spray.',
    lead: 'Pressure washing and exterior cleaning.',
    points: [
      'Watch commercial or residential cleans',
      'Document the finish remotely',
      'Same portable SiteEye kit'
    ],
    axon: 'Wash jobs are quick. Still nice to prove the work got done.'
  },
  {
    image: '/images/utilities.png',
    fallback: 'kit',
    title: 'Utilities.',
    line: 'Cable, power, municipal work — eyes on crews in the field.',
    lead: 'Utility and infrastructure jobs.',
    points: [
      'Remote oversight for field crews',
      'Cellular connection anywhere there\'s signal',
      'Ask Axon about pricing for your crew size'
    ],
    axon: 'Utility work stretches across the map. SiteEye covers the sites you can\'t visit.'
  }
];

const FALLBACK_SVG = {
  camera: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#E2E8F0" width="400" height="300"/><rect x="185" y="80" width="30" height="120" fill="#94A3B8" rx="4"/><circle cx="200" cy="60" r="28" fill="#2563EB" opacity="0.9"/><rect x="240" y="120" width="80" height="120" rx="12" fill="#1E293B"/><rect x="252" y="135" width="56" height="80" rx="4" fill="#93C5FD"/><text x="200" y="270" text-anchor="middle" fill="#64748B" font-size="14" font-family="sans-serif">Your photo: camera on pole</text></svg>`,
  pool: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#DBEAFE" width="400" height="300"/><ellipse cx="200" cy="200" rx="120" ry="50" fill="#2563EB" opacity="0.3"/><text x="200" y="160" text-anchor="middle" fill="#1E40AF" font-size="16" font-family="sans-serif">Your photo: pool / backyard</text></svg>`,
  setup: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#F1F5F9" width="400" height="300"/><text x="200" y="140" text-anchor="middle" fill="#64748B" font-size="16" font-family="sans-serif">Your photo: deploying the unit</text></svg>`,
  phone: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#F1F5F9" width="400" height="300"/><rect x="160" y="60" width="80" height="140" rx="10" fill="#1E293B"/><rect x="170" y="75" width="60" height="100" rx="2" fill="#93C5FD"/><text x="200" y="240" text-anchor="middle" fill="#64748B" font-size="14" font-family="sans-serif">Your photo: watching on phone</text></svg>`,
  kit: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#F1F5F9" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="#64748B" font-size="16" font-family="sans-serif">Your photo: kit / product</text></svg>`
};

function imgSrc(slide) {
  return slide.image;
}

function thumbSrc(slide) {
  return slide.image;
}

function onImgError(img, fallbackKey) {
  const svg = FALLBACK_SVG[fallbackKey];
  if (svg) img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

let idx = 0;
let history = [];
let pc = null, stream = null, dc = null, connecting = false;

const chat = document.getElementById('axon-chat');
const talkBtn = document.getElementById('talk-btn');
const filmstrip = document.getElementById('filmstrip');

SLIDES.forEach((s, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb' + (i === 0 ? ' on' : '');
  const img = document.createElement('img');
  img.src = thumbSrc(s);
  img.alt = `Slide ${i + 1}`;
  img.onerror = () => onImgError(img, s.fallback);
  btn.appendChild(img);
  const num = document.createElement('span');
  num.className = 'thumb-num';
  num.textContent = i + 1;
  btn.appendChild(num);
  btn.onclick = () => go(i);
  filmstrip.appendChild(btn);
});

function go(n) {
  idx = Math.max(0, Math.min(SLIDES.length - 1, n));
  const s = SLIDES[idx];
  const hero = document.getElementById('hero-img');
  hero.src = imgSrc(s);
  hero.alt = s.title;
  hero.onerror = () => onImgError(hero, s.fallback);

  document.getElementById('hero-title').textContent = s.title;
  document.getElementById('hero-line').textContent = s.line;
  document.getElementById('slide-tag').textContent = `Slide ${idx + 1}`;
  document.getElementById('slide-num').textContent = `${idx + 1} / ${SLIDES.length}`;
  document.getElementById('progress-fill').style.width = `${((idx + 1) / SLIDES.length) * 100}%`;

  document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('on', i === idx));
  document.getElementById('btn-back').disabled = idx === 0;
  document.getElementById('btn-fwd').textContent = idx === SLIDES.length - 1 ? '✓' : '▶';

  const frame = document.getElementById('slide-frame');
  frame.style.animation = 'none';
  frame.offsetHeight;
  frame.style.animation = '';

  if (s.axon && !s._shown) {
    s._shown = true;
    bubble(s.axon, 'them');
  }
}

document.getElementById('btn-back').onclick = () => go(idx - 1);
document.getElementById('btn-fwd').onclick = () => { if (idx < SLIDES.length - 1) go(idx + 1); };

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').hidden) {
    if (e.key === 'Escape') closeLightbox();
    return;
  }
  if (e.key === 'ArrowRight') go(idx + 1);
  if (e.key === 'ArrowLeft') go(idx - 1);
});

const lb = document.getElementById('lightbox');

function openLightbox() {
  const s = SLIDES[idx];
  const lbImg = document.getElementById('lb-img');
  lbImg.src = imgSrc(s);
  lbImg.onerror = () => onImgError(lbImg, s.fallback);
  document.getElementById('lb-title').textContent = s.title;
  document.getElementById('lb-lead').textContent = s.lead;
  document.getElementById('lb-points').innerHTML = s.points.map(p => `<li>${esc(p)}</li>`).join('');
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

function bubble(text, who = 'them') {
  const el = document.createElement('div');
  el.className = `bubble ${who}`;
  el.textContent = text;
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
  const wait = document.createElement('div');
  wait.className = 'bubble them';
  wait.textContent = '…';
  chat.appendChild(wait);
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
