export default function Toast({ visible, message }) {
  return (
    <div id="toast" className={visible ? "show" : ""} aria-live="polite">
      ✓ {message}
    </div>
  );
}
