import { useEffect, useRef } from "react";

const steps = [
  {
    title: "Create Your Profile",
    description:
      "Sign up and complete your health history in minutes. Your data is fully encrypted and HIPAA-compliant.",
  },
  {
    title: "Choose Your Service",
    description:
      "Browse our catalog of diagnostic, surgical, and wellness services and select the right one for your needs.",
  },
  {
    title: "Meet Your Doctor",
    description:
      "Connect with a specialist via video call or in-person and receive your personalised treatment plan.",
  },
];

export default function HowItWorks() {
  const stepsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, index * 150);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    stepsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how">
      <div>
        <div className="section-label">Simple Process</div>
        <h2 className="section-title">How our platform works</h2>
        <p className="section-sub" style={{ marginBottom: 36 }}>
          Getting expert gallbladder care has never been easier. Follow these
          three simple steps to begin your health journey.
        </p>

        <div className="steps">
          {steps.map((step, index) => (
            <div
              className="step"
              key={step.title}
              ref={(el) => (stepsRef.current[index] = el)}
            >
              <div className="step-num">{index + 1}</div>
              <div className="step-body">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="how-visual">
        <div className="how-doctor">👨‍⚕️</div>
        <p style={{ marginTop: 20, fontSize: "0.9rem", color: "var(--muted)" }}>
          Our specialists are available{" "}
          <strong style={{ color: "var(--teal)" }}>7 days a week</strong>,
          including evenings and weekends.
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 24,
          }}
        >
          <span className="pill">🏅 Board Certified</span>
          <span className="pill">🔒 HIPAA Secure</span>
          <span className="pill">⚡ Same-Day Booking</span>
        </div>
      </div>
    </section>
  );
}
