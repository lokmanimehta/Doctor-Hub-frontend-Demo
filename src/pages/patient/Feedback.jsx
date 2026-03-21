import React, { useState } from "react";
import "./Feedback.css";

const Feedback = () => {
  const [formData, setFormData] = useState({
    type: "",
    rating: 0,
    message: "",
    allowContact: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRating = (value) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Feedback Submitted:", formData);
    alert("Thank you! Your feedback has been submitted.");
    setFormData({ type: "", rating: 0, message: "", allowContact: false });
  };

  return (
    <div className="feedback-wrapper">
      <header className="feedback-header">
        <h1>Feedback</h1>
        <p>Your feedback helps us improve your care experience</p>
      </header>

      <div className="feedback-card">
        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Dropdown Section */}
          <div className="form-group">
            <label>Feedback Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="" disabled>Select</option>
              <option value="Appointment">Appointment</option>
              <option value="Consultation">Consultation</option>
              <option value="Lab">Lab Reports</option>
              <option value="App">App Experience</option>
            </select>
          </div>

          {/* Rating Section */}
          <div className="form-group">
            <label>Rating (optional)</label>
            <div className="star-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= formData.rating ? "star active" : "star"}
                  onClick={() => handleRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Textarea Section */}
          <div className="form-group">
            <label>Your Feedback</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what went well or what we can improve..."
              required
              className="form-control textarea"
            />
          </div>

          {/* Checkbox Section */}
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="allowContact"
              name="allowContact"
              checked={formData.allowContact}
              onChange={handleChange}
            />
            <label htmlFor="allowContact">
              You may contact me regarding this feedback
            </label>
          </div>

          <button type="submit" className="btn-submit">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;