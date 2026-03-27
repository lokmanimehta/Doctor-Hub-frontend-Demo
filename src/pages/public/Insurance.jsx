import React from "react";
import { ShieldCheck, HeartPulse, CheckCircle2, HelpCircle } from "lucide-react";
import "./Insurance.css";

const Insurance = () => {
  const plans = [
    {
      name: "Standard Shield",
      price: "₹499/mo",
      tag: "Basic Security",
      features: ["5,000+ Network Hospitals", "Ambulance Charges", "Day Care Procedures", "1-Year Waiting Period"],
    },
    {
      name: "Global Gold",
      price: "₹1,499/mo",
      tag: "Most Recommended",
      features: ["Worldwide Coverage", "Zero Waiting Period", "Maternity & Newborn", "Air Ambulance", "OPD Cover"],
      dark: true
    }
  ];

  return (
    <div className="ins-container">
      <div className="ins-header">
        <h1>Health Insurance Plans</h1>
        <p>Direct cashless tie-ups with India's leading healthcare providers.</p>
      </div>

      <div className="ins-grid">
        {plans.map((plan, i) => (
          <div key={i} className={`ins-card ${plan.dark ? "dark-card" : ""}`}>
            <div className="plan-header">
              <span className="plan-tag">{plan.tag}</span>
              <h3>{plan.name}</h3>
              <div className="price">{plan.price} <span>/month</span></div>
            </div>
            
            <ul className="plan-features">
              {plan.features.map((f, idx) => (
                <li key={idx}><CheckCircle2 size={16} /> {f}</li>
              ))}
            </ul>

            <button className="ins-btn">Compare & Apply</button>
          </div>
        ))}
      </div>

      {/* NEW: FAQ SECTION */}
      <div className="ins-faq-section">
        <div className="faq-header">
          <HelpCircle size={24} />
          <h2>Understand Your Plan</h2>
        </div>
        <div className="faq-grid">
          <div className="faq-box">
            <h4>What is Cashless Treatment?</h4>
            <p>You don't pay anything at the hospital. We settle the bill directly with the provider.</p>
          </div>
          <div className="faq-box">
            <h4>Pre-existing Disease coverage?</h4>
            <p>Our Gold plan covers chronic conditions after only 30 days of cooling period.</p>
          </div>
        </div>
      </div>

      <div className="ins-trust-bar">
        <div className="trust-item"><ShieldCheck size={28}/> <span>IRDAI Certified</span></div>
        <div className="trust-item"><HeartPulse size={28}/> <span>99.2% Claim Ratio</span></div>
      </div>
    </div>
  );
};

export default Insurance;