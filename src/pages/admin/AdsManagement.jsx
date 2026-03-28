import React, { useState } from "react";
import "./AdsManagement.css";

const AdsManagement = () => {

  // ✅ Default form (IMPORTANT: status kabhi undefined nahi hoga)
  const emptyForm = {
    title: "",
    url: "",
    placement: "HOME_TOP",
    status: "ACTIVE",
    startDate: "",
    endDate: "",
    image: null
  };

  // ✅ Initial dummy ads (no useEffect → ESLint warning fix)
  const [ads, setAds] = useState([
    {
      id: 1,
      title: "Apollo Banner",
      placement: "HOME_TOP",
      status: "ACTIVE",
      startDate: "2026-03-01",
      endDate: "2026-04-01",
      image: null,
      url: "#"
    },
    {
      id: 2,
      title: "Clinic Promo",
      placement: "DOCTOR_LIST",
      status: "PAUSED",
      startDate: "2026-03-05",
      endDate: "2026-03-25",
      image: null,
      url: "#"
    }
  ]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [device, setDevice] = useState("desktop");

  // ✅ Expiry logic
  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  // ✅ Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Image preview
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = URL.createObjectURL(file);
      setPreview(img);
      setForm(prev => ({ ...prev, image: img }));
    }
  };

  // ✅ Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setAds(prev =>
        prev.map(ad =>
          ad.id === editingId ? { ...form, id: editingId } : ad
        )
      );
    } else {
      setAds(prev => [
        { ...form, id: Date.now() },
        ...prev
      ]);
    }

    setForm(emptyForm);
    setPreview(null);
    setEditingId(null);
  };

  // ✅ Edit
  const handleEdit = (ad) => {
    setForm(ad);
    setEditingId(ad.id);
    setPreview(ad.image);
  };

  // ✅ Delete
  const handleDelete = (id) => {
    setAds(prev => prev.filter(ad => ad.id !== id));
  };

  // ✅ Toggle status
  const toggleStatus = (id) => {
    setAds(prev =>
      prev.map(ad =>
        ad.id === id
          ? {
              ...ad,
              status: ad.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
            }
          : ad
      )
    );
  };

  return (
    <div className="ads-page">

      {/* ===== HEADER ===== */}
      <div className="ads-header">
        <h2>Ads Management</h2>
        <p>Manage banners and campaigns</p>
      </div>

      {/* ===== FORM + PREVIEW ===== */}
      <div className="ads-grid">

        <div className="card">
          <h3>{editingId ? "Edit Ad" : "Create Ad"}</h3>

          <form onSubmit={handleSubmit} className="ads-form">

            <input
              name="title"
              placeholder="Ad Title"
              value={form.title}
              onChange={handleChange}
              required
            />

            <input
              name="url"
              placeholder="Redirect URL"
              value={form.url}
              onChange={handleChange}
              required
            />

            <input type="file" onChange={handleImage} />

            <select
              name="placement"
              value={form.placement}
              onChange={handleChange}
            >
              <option value="HOME_TOP">Home Top</option>
              <option value="DOCTOR_LIST">Doctor List</option>
              <option value="BLOG">Blog Page</option>
            </select>

            <div className="row">
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
              />
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>

            <button type="submit">
              {editingId ? "Update Ad" : "Create Ad"}
            </button>

          </form>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="card">
          <h3>Live Preview</h3>

          <div className="device-toggle">
            <button
              className={device === "desktop" ? "active" : ""}
              onClick={() => setDevice("desktop")}
              type="button"
            >
              Desktop
            </button>

            <button
              className={device === "mobile" ? "active" : ""}
              onClick={() => setDevice("mobile")}
              type="button"
            >
              Mobile
            </button>
          </div>

          <div className={`preview ${device}`}>
            {preview ? (
              <img src={preview} alt="preview" />
            ) : (
              <span>No Preview</span>
            )}
          </div>
        </div>

      </div>

      {/* ===== TABLE ===== */}
      <div className="card">
        <h3>All Ads</h3>

        <table className="ads-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Placement</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {ads.map(ad => {
              const expired = isExpired(ad.endDate);
              const status = expired ? "EXPIRED" : (ad.status || "UNKNOWN");

              return (
                <tr key={ad.id}>
                  <td>{ad.title}</td>
                  <td>{ad.placement}</td>

                  {/* ✅ SAFE (no crash) */}
                  <td className={(status || "").toLowerCase()}>
                    {status}
                  </td>

                  <td>
                    {ad.startDate || "-"} → {ad.endDate || "-"}
                  </td>

                  <td>
                    <button onClick={() => handleEdit(ad)}>Edit</button>
                    <button onClick={() => toggleStatus(ad.id)}>Toggle</button>
                    <button onClick={() => handleDelete(ad.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default AdsManagement;