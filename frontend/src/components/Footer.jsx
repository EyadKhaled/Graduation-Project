export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <a className="logo" href="#" style={{ color: "white" }}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.7 2 6 4.7 6 8c0 2.5 1.4 4.7 3.5 5.8L8 21h8l-1.5-7.2C16.6 12.7 18 10.5 18 8c0-3.3-2.7-6-6-6zm0 2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z" />
              </svg>
            </div>
            GallCare
          </a>
          <p>
            Your trusted digital partner for comprehensive gallbladder health
            and expert specialist care.
          </p>
        </div>

        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li>
              <a href="#">Diagnostics</a>
            </li>
            <li>
              <a href="#">Telehealth</a>
            </li>
            <li>
              <a href="#">Surgery Reports</a>
            </li>
            <li>
              <a href="#">Nutrition</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li>
              <a href="#">About Us</a>
            </li>
            <li>
              <a href="#">Our Doctors</a>
            </li>
            <li>
              <a href="#">Careers</a>
            </li>
            <li>
              <a href="#">Blog</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li>
              <a href="#">Privacy Policy</a>
            </li>
            <li>
              <a href="#">Terms of Use</a>
            </li>
            <li>
              <a href="#">HIPAA Notice</a>
            </li>
            <li>
              <a href="#">Cookie Policy</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 GallCare. All rights reserved. Built for your health.</p>
        <div className="socials">
          <a href="#" className="social-btn">
            f
          </a>
          <a href="#" className="social-btn">
            in
          </a>
          <a href="#" className="social-btn">
            tw
          </a>
          <a href="#" className="social-btn">
            yt
          </a>
        </div>
      </div>
    </footer>
  );
}
