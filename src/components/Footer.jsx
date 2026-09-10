export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>&copy; <span>{new Date().getFullYear()}</span> Harish S. Crafted with code and curiosity.</p>
        <button
          className="back-to-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      </div>
    </footer>
  );
}
