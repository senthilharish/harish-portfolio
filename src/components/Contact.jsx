import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setNote('Sending…');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setNote(`Thanks${form.name ? ', ' + form.name : ''}! Your message has been sent — I'll get back to you soon.`);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setNote(`${err.message || 'Something went wrong.'} You can also email me directly at sindhuharish2802@gmail.com.`);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="section alt-bg">
      <div className="container">
        <p className="section-tag reveal">Let's Connect</p>
        <h2 className="section-title reveal">Get In Touch</h2>
        <p className="contact-intro reveal">Have a project in mind or an opportunity to discuss? My inbox is always open.</p>

        <div className="contact-grid">
          <div className="neu-card contact-info reveal">
            <div className="contact-row">
              <span className="contact-icon">✉</span>
              <div>
                <p className="contact-label">Email</p>
                <a href="mailto:sindhuharish2802@gmail.com">sindhuharish2802@gmail.com</a>
              </div>
            </div>
            <div className="contact-row">
              <span className="contact-icon">☎</span>
              <div>
                <p className="contact-label">Phone</p>
                <a href="tel:+916382322728">+91 63823 22728</a>
              </div>
            </div>
            <div className="contact-row">
              <span className="contact-icon">📍</span>
              <div>
                <p className="contact-label">Location</p>
                <p>Seethapal, Bhoothapandy (P.O.), Kanyakumari, 629852</p>
              </div>
            </div>
          </div>

          <form className="neu-card contact-form reveal" onSubmit={onSubmit}>
            <div className="form-group">
              <input type="text" id="name" name="name" required placeholder=" " value={form.name} onChange={onChange} />
              <label htmlFor="name">Your Name</label>
            </div>
            <div className="form-group">
              <input type="email" id="email" name="email" required placeholder=" " value={form.email} onChange={onChange} />
              <label htmlFor="email">Your Email</label>
            </div>
            <div className="form-group">
              <textarea id="message" name="message" rows="4" required placeholder=" " value={form.message} onChange={onChange}></textarea>
              <label htmlFor="message">Message</label>
            </div>
            <button type="submit" className="btn btn-primary full-width" disabled={sending}>Send Message</button>
            <p className="form-note">{note}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
