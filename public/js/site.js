// SiteEye Live — simple client

let step = 1;
const STEPS = 4;
let history = [];
let pc = null, stream = null, dc = null, connecting = false;

const chat = document.getElementById('axon-chat');
const talkBtn = document.getElementById('talk-btn');

function showStep(n) {
  step = Math.max(1, Math.min(STEPS, n));
  document.querySelectorAll('.story-slide').forEach(s =>
    s.classList.toggle('on', +s.dataset.step === step));
  document.getElementById('story-count').textContent = `${step} of ${STEPS}`;
  document.getElementById('story-back').disabled = step === 1;
  document.getElementById('story-next').textContent = step === STEPS ? 'Done' : 'Next';
}

document.getElementById('story-back').onclick = () => showStep(step - 1);
document.getElementById('story-next').onclick = () => { if (step < STEPS) showStep(step + 1); };

function bubble(text, who = 'them') {
  const el = document.createElement('div');
  el.className = `bubble ${who}`;
  el.innerHTML = who === 'them' ? text : esc(text);
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
    bubble(esc(data.reply || 'Try again.'), 'them');
    history.push({ role: 'assistant', content: data.reply });
  } catch {
    wait.remove();
    bubble('Connection problem. Try again.', 'them');
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
        if (ev.type === 'response.audio_transcript.done' && ev.transcript) {
          bubble(esc(ev.transcript.trim()), 'them');
        }
        if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) {
          bubble(esc(ev.transcript), 'you');
        }
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
    bubble(esc(err.message || 'Voice not available — type your question instead.'), 'them');
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
