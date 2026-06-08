// SiteEye Live — AxonAI client (voice + text + topic panels)

const chatMessages = document.getElementById('axon-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const voiceBtn = document.getElementById('voice-btn');
const voiceLabel = document.getElementById('voice-label');
const axonStatus = document.getElementById('axon-status');

let chatHistory = [];
let pc = null;
let localStream = null;
let dataChannel = null;
let voiceStarting = false;

// ---- Topic panels ----

const TOPIC_KEYWORDS = {
  overview: ['overview', 'what is', 'siteeye', 'intro', 'about', 'tagline'],
  how: ['how it works', 'how does', 'steps', 'deploy', 'setup', 'process'],
  hardware: ['hardware', 'kit', 'components', 'camera', 'mast', 'tripod', 'hotspot', 'battery', 'enclosure', 'box'],
  pricing: ['pricing', 'price', 'cost', 'month', 'basic', 'pro', 'purchase', 'service', 'tier', 'how much'],
  markets: ['market', 'who', 'contractor', 'asphalt', 'roofing', 'landscaping', 'concrete', 'municipal'],
  future: ['future', 'roadmap', 'coming', 'ai feature', 'activity detection', 'dashboard'],
  contact: ['contact', 'early access', 'order', 'sign up', 'email', 'reach', 'demo']
};

function showTopic(topic) {
  document.querySelectorAll('.topic').forEach(t => {
    t.classList.toggle('active', t.dataset.topic === topic);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === topic);
  });
}

document.querySelectorAll('.topic').forEach(btn => {
  btn.addEventListener('click', () => showTopic(btn.dataset.topic));
});

function detectTopic(text) {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return topic;
  }
  return null;
}

// ---- Text chat ----

function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const label = role === 'user' ? 'You' : 'AxonAI';
  div.innerHTML = `<strong>${label}</strong><p>${escapeHtml(text)}</p>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  addMsg(text, 'user');
  chatHistory.push({ role: 'user', content: text });

  const topic = detectTopic(text);
  if (topic) showTopic(topic);

  const loading = addMsg('…', 'bot loading');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory })
    });
    const data = await res.json();
    loading.remove();
    const reply = data.reply || 'Sorry, something went wrong.';
    addMsg(reply, 'bot');
    chatHistory.push({ role: 'assistant', content: reply });

    const replyTopic = detectTopic(reply);
    if (replyTopic) showTopic(replyTopic);
  } catch {
    loading.remove();
    addMsg('Unable to reach AxonAI. Check your connection.', 'bot');
  }
}

chatSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

// ---- Voice (OpenAI Realtime — Axon / VoxTalk pattern) ----

async function stopVoice() {
  if (dataChannel) { try { dataChannel.close(); } catch {} dataChannel = null; }
  if (pc) { try { pc.close(); } catch {} pc = null; }
  if (localStream) {
    try { localStream.getTracks().forEach(t => t.stop()); } catch {}
    localStream = null;
  }
  document.body.classList.remove('voice-active');
  voiceStarting = false;
  voiceLabel.textContent = 'Tap to Talk';
  axonStatus.textContent = 'Ready';
}

async function startVoice() {
  if (pc || voiceStarting) return;
  voiceStarting = true;
  voiceLabel.textContent = 'Connecting…';
  axonStatus.textContent = 'Connecting';

  try {
    const r = await fetch('/session');
    const data = await r.json();
    if (!r.ok || data.error) throw new Error(data.error || 'Session failed');

    pc = new RTCPeerConnection();

    const audio = document.createElement('audio');
    audio.autoplay = true;
    pc.ontrack = e => {
      if (audio.srcObject !== e.streams[0]) audio.srcObject = e.streams[0];
    };

    dataChannel = pc.createDataChannel('oai-events');
    dataChannel.onopen = () => {
      document.body.classList.add('voice-active');
      voiceLabel.textContent = 'Listening…';
      axonStatus.textContent = 'Live';
      dataChannel.send(JSON.stringify({
        type: 'response.create',
        response: { modalities: ['audio', 'text'] }
      }));
    };
    dataChannel.onmessage = e => {
      try {
        const event = JSON.parse(e.data);
        handleVoiceEvent(event);
      } catch {}
    };

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(localStream.getTracks()[0]);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = data.model || 'gpt-realtime';
    const sdpRes = await fetch(
      'https://api.openai.com/v1/realtime?model=' + encodeURIComponent(model),
      {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: 'Bearer ' + data.client_secret.value,
          'Content-Type': 'application/sdp'
        }
      }
    );
    if (!sdpRes.ok) throw new Error('Voice connection failed');

    await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });
    voiceStarting = false;
  } catch (err) {
    console.error('Voice error:', err);
    voiceLabel.textContent = 'Tap to Talk';
    axonStatus.textContent = 'Error';
    addMsg(err.message || 'Voice connection failed. Use text chat instead.', 'bot');
    await stopVoice();
  }
}

function handleVoiceEvent(event) {
  if (event.type === 'response.audio_transcript.done' && event.transcript) {
    addMsg(event.transcript, 'bot');
    const topic = detectTopic(event.transcript);
    if (topic) showTopic(topic);
  }
  if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) {
    addMsg(event.transcript, 'user');
  }
  if (event.type === 'input_audio_buffer.speech_started') {
    voiceLabel.textContent = 'Your turn…';
  }
  if (event.type === 'response.created') {
    voiceLabel.textContent = 'AxonAI speaking…';
  }
  if (event.type === 'response.done') {
    voiceLabel.textContent = 'Listening…';
  }
}

voiceBtn.addEventListener('click', async () => {
  if (pc || voiceStarting) await stopVoice();
  else await startVoice();
});

// ---- Contact form ----

document.getElementById('contact-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('contact-msg');
  msg.textContent = 'Sending…';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('c-name').value,
        email: document.getElementById('c-email').value,
        phone: document.getElementById('c-phone').value,
        company: document.getElementById('c-company').value,
        type: document.getElementById('c-type').value,
        message: document.getElementById('c-message').value,
        subject: 'Early Access — AxonAI Briefing'
      })
    });
    const data = await res.json();
    msg.textContent = data.ok ? '✓ Got it — we\'ll be in touch.' : 'Something went wrong.';
  } catch {
    msg.textContent = 'Error sending.';
  }
});
