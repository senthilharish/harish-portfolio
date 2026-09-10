import { useEffect, useRef, useState } from 'react';

let uid = 0;
const nextId = () => ++uid;

export default function BubuWidget() {
  const [open, setOpen] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(true);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(null);
  const [replay, setReplay] = useState(false);

  const bodyRef = useRef(null);
  const dataRef = useRef({ type: '', details: '', email: '' });
  const startedRef = useRef(false);
  const timersRef = useRef({});

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  };

  const addBotMessage = (text, delay = 550) =>
    new Promise((resolve) => {
      const typingId = nextId();
      setMessages((m) => [...m, { id: typingId, kind: 'typing' }]);
      scrollToBottom();
      setTimeout(() => {
        setMessages((m) => [
          ...m.filter((msg) => msg.id !== typingId),
          { id: nextId(), kind: 'bot', text },
        ]);
        scrollToBottom();
        resolve();
      }, delay);
    });

  const addUserMessage = (text) => {
    setMessages((m) => [...m, { id: nextId(), kind: 'user', text }]);
    scrollToBottom();
  };

  const addChoices = (options, onPick) => {
    setPending({ kind: 'choices', options, onPick });
    scrollToBottom();
  };

  const addTextInput = (opts, onSubmit) => {
    setPending({ kind: 'input', ...opts, onSubmit });
    scrollToBottom();
  };

  const handlePick = (opt) => {
    setPending(null);
    addUserMessage(opt);
    pending.onPick(opt);
  };

  const handleTextSubmit = (value) => {
    if (!value.trim()) return;
    setPending(null);
    addUserMessage(value.trim());
    pending.onSubmit(value.trim());
  };

  async function startConversation() {
    if (startedRef.current) return;
    startedRef.current = true;
    setMessages([]);
    await addBotMessage("Hi there! I'm Bubu 🐻 Are you looking to get a freelance project built?", 400);
    addChoices(["Yes, let's talk", 'Not right now'], (choice) => {
      if (choice === 'Not right now') {
        addBotMessage("No worries — I'll be right here if you change your mind! 🐾");
        return;
      }
      askProjectType();
    });
  }

  async function askProjectType() {
    await addBotMessage('Awesome! What kind of project are you thinking of?');
    addChoices(['📱 Mobile App', '🌐 Web App', '🤖 AI / ML', '💡 Something else'], (choice) => {
      dataRef.current.type = choice.replace(/^\S+\s/, '');
      askDetails();
    });
  }

  async function askDetails() {
    await addBotMessage('Nice choice! Tell me a bit about what you need — features, timeline, anything helpful.');
    addTextInput({ multiline: true, placeholder: 'Describe your project…', buttonLabel: 'Next' }, (value) => {
      dataRef.current.details = value;
      askEmail();
    });
  }

  async function askEmail() {
    await addBotMessage("Last thing — what's the best email to reach you at?");
    addTextInput({ placeholder: 'you@example.com', buttonLabel: 'Send', type: 'email' }, (value) => {
      dataRef.current.email = value;
      sendInquiry();
    });
  }

  async function sendInquiry() {
    const { type, details, email } = dataRef.current;
    const subject = encodeURIComponent(`Freelance Project Inquiry — ${type}`);
    const bodyText = encodeURIComponent(
      `Project type: ${type}\n\nDetails:\n${details}\n\nReply-to email: ${email}`,
    );
    window.location.href = `mailto:sindhuharish2802@gmail.com?subject=${subject}&body=${bodyText}`;
    await addBotMessage('🎉 Your email app should be opening now with everything filled in. Talk soon!');
    addChoices(['Start over'], () => {
      startedRef.current = false;
      startConversation();
    });
  }

  const replayPanda = (videoEl) => {
    if (!videoEl) return;
    videoEl.currentTime = 0;
    videoEl.play().catch(() => {});
    setReplay(false);
    requestAnimationFrame(() => setReplay(true));
  };

  const openPanel = (videoEl) => {
    replayPanda(videoEl);
    setTeaserVisible(false);
    setTimeout(() => {
      setOpen(true);
      setBadgeVisible(false);
      startConversation();
    }, 350);
  };

  const closePanel = () => setOpen(false);

  useEffect(() => {
    if (sessionStorage.getItem('bubuGreeted')) return;
    timersRef.current.teaser = setTimeout(() => setTeaserVisible(true), 3000);
    timersRef.current.autoOpen = setTimeout(() => {
      openPanel(document.getElementById('bubuPandaVideo'));
      sessionStorage.setItem('bubuGreeted', '1');
    }, 5000);
    return () => {
      clearTimeout(timersRef.current.teaser);
      clearTimeout(timersRef.current.autoOpen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFabClick = () => {
    clearTimeout(timersRef.current.teaser);
    clearTimeout(timersRef.current.autoOpen);
    setTeaserVisible(false);
    sessionStorage.setItem('bubuGreeted', '1');
    if (open) {
      closePanel();
    } else {
      openPanel(document.getElementById('bubuPandaVideo'));
    }
  };

  return (
    <div className="bubu-widget" id="bubuWidget">
      <div className={`bubu-teaser${teaserVisible ? ' visible' : ''}`}>Got a project in mind? 👋</div>

      <div className={`bubu-panel${open ? ' open' : ''}`}>
        <div className="bubu-panel-head">
          <div className="bubu-panda-wrap bubu-panda-wrap--xs">
            <video className="bubu-panda-video" src="/assets/panda.mp4" autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback />
          </div>
          <div className="bubu-head-text">
            <p className="bubu-name">Bubu</p>
            <p className="bubu-status">Freelance Assistant</p>
          </div>
          <button className="bubu-close" aria-label="Close chat" onClick={closePanel}>&times;</button>
        </div>
        <div className="bubu-body" ref={bodyRef}>
          {messages.map((msg) => {
            if (msg.kind === 'typing') {
              return (
                <div className="bubu-typing" key={msg.id}>
                  <span></span><span></span><span></span>
                </div>
              );
            }
            return (
              <div className={`bubu-msg ${msg.kind}`} key={msg.id}>{msg.text}</div>
            );
          })}

          {pending?.kind === 'choices' && (
            <div className="bubu-choices">
              {pending.options.map((opt) => (
                <button
                  type="button"
                  className="bubu-choice-btn"
                  key={opt}
                  onClick={() => handlePick(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {pending?.kind === 'input' && (
            <BubuTextInput
              multiline={pending.multiline}
              placeholder={pending.placeholder}
              buttonLabel={pending.buttonLabel}
              type={pending.type}
              onSubmit={handleTextSubmit}
            />
          )}
        </div>
      </div>

      <button className="bubu-fab" aria-label="Chat with Bubu about a freelance project" onClick={onFabClick}>
        <div className={`bubu-panda-wrap bubu-panda-wrap--sm${replay ? ' replay' : ''}`}>
          <video className="bubu-panda-video" id="bubuPandaVideo" src="/assets/panda.mp4" autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback />
        </div>
        {badgeVisible && <span className="bubu-badge">1</span>}
      </button>
    </div>
  );
}

function BubuTextInput({ multiline, placeholder, buttonLabel, type = 'text', onSubmit }) {
  const [value, setValue] = useState('');
  const fieldRef = useRef(null);

  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline && value.trim()) {
      e.preventDefault();
      submit();
    }
  };

  const commonProps = {
    ref: fieldRef,
    placeholder,
    value,
    onChange: (e) => setValue(e.target.value),
    onKeyDown,
  };

  return (
    <div className="bubu-input-row">
      {multiline ? (
        <textarea rows={2} {...commonProps} />
      ) : (
        <input type={type} {...commonProps} />
      )}
      <button type="button" className="bubu-send-btn" disabled={!value.trim()} onClick={submit}>
        {buttonLabel}
      </button>
    </div>
  );
}
