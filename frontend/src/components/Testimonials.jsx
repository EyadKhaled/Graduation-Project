import { useEffect, useRef, useState } from "react";

const reviews = [
  {
    stars: "★★★★★",
    message:
      "The telehealth consultation was incredibly thorough. My doctor explained everything clearly and I felt genuinely heard. Diagnosed with gallstones within 24 hours.",
    avatar: "SR",
    name: "Sarah R.",
    role: "Verified Patient",
    background: "#0ABFAA",
  },
  {
    stars: "★★★★★",
    message:
      "After months of unexplained pain, GallCare finally gave me answers. The MRCP imaging was seamlessly arranged and the nutritional counseling changed my life.",
    avatar: "JM",
    name: "James M.",
    role: "Verified Patient",
    background: "#163552",
  },
  {
    stars: "★★★★☆",
    message:
      "Booking was effortless and the doctor was punctual and professional. The follow-up care after my cholecystectomy was exceptional. Highly recommend to anyone.",
    avatar: "LK",
    name: "Layla K.",
    role: "Verified Patient",
    background: "#F5A623",
  },
];

export default function Testimonials() {
  const [counts, setCounts] = useState({
    patients: 0,
    consults: 0,
    rating: 0,
    docs: 0,
  });
  const statsRef = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const section = statsRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const duration = 1200;

          const target = {
            patients: 10000,
            consults: 2500,
            rating: 98,
            docs: 200,
          };

          const step = (timestamp) => {
            const progress = Math.min((timestamp - start) / duration, 1);
            setCounts({
              patients: Math.round(target.patients * progress),
              consults: Math.round(target.consults * progress),
              rating: Math.round(target.rating * progress),
              docs: Math.round(target.docs * progress),
            });

            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };

          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="testimonials">
      <div className="section-head">
        <div className="section-label">Patient Testimonials</div>
        <h2 className="section-title">Hear from those we've cared for</h2>
        <p className="section-sub">
          Real stories from real patients who trusted GallCare with their
          health.
        </p>
      </div>

      <div className="testimonials-grid">
        {reviews.map((review, index) => (
          <div className="testimonial-card" key={index}>
            <div className="stars">{review.stars}</div>
            <p>{review.message}</p>
            <div className="reviewer">
              <div
                className="reviewer-avatar"
                style={{ background: review.background }}
              >
                {review.avatar}
              </div>
              <div>
                <div className="reviewer-name">{review.name}</div>
                <div className="reviewer-role">{review.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-bar" ref={statsRef}>
        <div className="stat-item">
          <span className="num">{counts.patients.toLocaleString()}+</span>
          <span className="label">Patients Treated</span>
        </div>
        <div className="stat-item">
          <span className="num">{counts.consults.toLocaleString()}+</span>
          <span className="label">Consultations</span>
        </div>
        <div className="stat-item">
          <span className="num">{counts.rating}%</span>
          <span className="label">Satisfaction Rate</span>
        </div>
        <div className="stat-item">
          <span className="num">{counts.docs}+</span>
          <span className="label">Expert Doctors</span>
        </div>
      </div>
    </section>
  );
}
