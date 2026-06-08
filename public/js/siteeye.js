// ============ NAV SCROLL ============
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 40 ? 'rgba(245,197,24,0.2)' : 'rgba(42,42,42,1)';
});

// ============ HAMBURGER ============
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '64px';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.background = '#111';
  navLinks.style.padding = '16px 24px';
  navLinks.style.borderBottom = '1px solid #2A2A2A';
});

// ============ TABS ============
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
  });
});

// ============ CHAT WIDGET ============
const chatToggle = document.getElementById('chat-toggle');
const chatBox = document.getElementById('chat-box');
const chatClose = document.getElementById('chat-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

chatToggle?.addEventListener('click', () => chatBox.classList.toggle('open'));
chatClose?.addEventListener('click', () => chatBox.classList.remove('open'));

function addMsg(text, type) {
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  addMsg(text, 'user');
  const loading = addMsg('Thinking', 'bot loading');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    loading.remove();
    addMsg(data.reply || 'Sorry, something went wrong.', 'bot');
  } catch {
    loading.remove();
    addMsg('Unable to connect. Please try again.', 'bot');
  }
}

chatSend?.addEventListener('click', sendChat);
chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

// ============ EARLY ACCESS FORM ============
document.getElementById('access-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('form-msg');
  msg.textContent = 'Sending...';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('ea-name').value,
        company: document.getElementById('ea-company').value,
        email: document.getElementById('ea-email').value,
        phone: document.getElementById('ea-phone').value,
        type: document.getElementById('ea-type').value,
        subject: 'Early Access Request'
      })
    });
    const data = await res.json();
    msg.textContent = data.ok ? '✓ Got it! We\'ll be in touch soon.' : 'Something went wrong. Please email us directly.';
  } catch {
    msg.textContent = 'Error sending. Please try again.';
  }
});

// ============ CONTACT FORM ============
document.getElementById('contact-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('contact-msg');
  msg.textContent = 'Sending...';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('c-name').value,
        email: document.getElementById('c-email').value,
        phone: document.getElementById('c-phone').value,
        message: document.getElementById('c-message').value,
        subject: 'Contact Form'
      })
    });
    const data = await res.json();
    msg.textContent = data.ok ? '✓ Message sent! We\'ll call you back same day.' : 'Something went wrong. Please try again.';
  } catch {
    msg.textContent = 'Error sending. Please try again.';
  }
});
