const services = [
  {
    icon: "🔬",
    title: "Diagnostic Ultrasound",
    description:
      "State-of-the-art imaging to detect gallstones, inflammation, and structural abnormalities with precision.",
  },
  {
    icon: "📋",
    title: "Cholecystectomy Report",
    description:
      "Detailed surgical reports and pre-op consultations for gallbladder removal procedures.",
    badge: "Popular",
  },
  {
    icon: "💊",
    title: "Non-Surgical Treatments",
    description:
      "Medication management and lifestyle interventions for mild to moderate gallbladder disease.",
  },
  {
    icon: "🩻",
    title: "MRCP Imaging",
    description:
      "Advanced magnetic resonance cholangiopancreatography for detailed bile duct evaluation.",
  },
  {
    icon: "🥗",
    title: "Nutritional Counseling",
    description:
      "Personalized diet plans to reduce gallbladder stress and prevent recurrence after treatment.",
  },
  {
    icon: "📞",
    title: "24/7 Telehealth",
    description:
      "Round-the-clock virtual consultations with board-certified gastroenterologists from your home.",
  },
];

export default function Services() {
  return (
    <section id="services">
      <div className="section-head">
        <div className="section-label">What We Offer</div>
        <h2 className="section-title">Top services we offer</h2>
        <p className="section-sub">
          From initial diagnosis to post-operative care, our specialists cover
          every stage of your gallbladder health journey.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-icon">{service.icon}</div>
            <div className="service-card-header">
              <h3>{service.title}</h3>
              {service.badge ? (
                <span className="service-badge">{service.badge}</span>
              ) : null}
            </div>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
