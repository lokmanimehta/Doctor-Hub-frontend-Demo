import React, { useState } from "react";
import "./AdsManagement.css";

const AdsManagement = () => {
    


    const emptyForm = {
        title: "",
        url: "",
        placement: "Home Top",
        status: "Active",
        start: "",
        end: "",
        image: null
    };

    const [ads, setAds] = useState([
        { id: 1, title: "Apollo Banner", placement: "Home Top", start: "2026-03-10", end: "2026-03-20", status: "Active", image: null, url: "#" },
        { id: 2, title: "Clinic Promo", placement: "Doctor List", start: "2026-03-05", end: "2026-03-25", status: "Paused", image: null, url: "#" }
    ]);
    

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [device, setDevice] = useState("desktop");
    const [deleteId, setDeleteId] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImage = (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const preview = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, image: preview }));
    } catch (err) {
      console.error("Image preview error:", err);
    }
  }
};
    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingId) {
            setAds(prev => prev.map(ad => ad.id === editingId ? { ...form, id: editingId } : ad));
            setEditingId(null);
        } else {
            const newAd = { ...form, id: Date.now() };
            setAds(prev => [newAd, ...prev]);
        }

        setForm(emptyForm);
    };

    const handleEdit = (ad) => {
        setForm({ ...ad });
        setEditingId(ad.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const openDelete = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        setAds(prev => prev.filter(ad => ad.id !== deleteId));
        setDeleteId(null);
    };

    const toggleStatus = (id) => {
        setAds(prev => prev.map(ad => {
            if (ad.id === id) {
                return { ...ad, status: ad.status === "Active" ? "Paused" : "Active" };
            }
            return ad;
        }));
    };

    return (

        <div className="ads-wrapper">

            <header className="ads-header">
                <h1>Ads Management</h1>
                <p>Manage promotional banners</p>
            </header>

            <main className="ads-main-layout">

                <section className="form-preview-container">

                    <div className="ui-card">
                        <div className="ui-card-header">
                            {editingId ? "EDIT AD" : "CREATE AD"}
                        </div>

                        <div className="ui-card-body">

                            <form className="ads-form" onSubmit={handleSubmit}>

                                <div className="input-group">
                                    <label>Ad Title</label>
                                    <input name="title" value={form.title} onChange={handleChange} required />
                                </div>

                                <div className="input-group">
                                    <label>Redirect URL</label>
                                    <input name="url" value={form.url} onChange={handleChange} required />
                                </div>

                                <div className="input-group">
                                    <label>Banner Image</label>
                                    <input type="file" accept="image/*" onChange={handleImage} />
                                </div>

                                <div className="input-row">

                                    <div className="input-group">
                                        <label>Placement</label>
                                        <select name="placement" value={form.placement} onChange={handleChange}>
                                            <option>Home Top</option>
                                            <option>Doctor List</option>
                                            <option>Blog Page</option>
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Status</label>
                                        <select name="status" value={form.status} onChange={handleChange}>
                                            <option>Active</option>
                                            <option>Paused</option>
                                        </select>
                                    </div>

                                </div>

                                <div className="input-row">

                                    <div className="input-group">
                                        <label>Start</label>
                                        <input type="date" name="start" value={form.start} onChange={handleChange} />
                                    </div>

                                    <div className="input-group">
                                        <label>End</label>
                                        <input type="date" name="end" value={form.end} onChange={handleChange} />
                                    </div>

                                </div>

                                <button className="btn-submit">
                                    {editingId ? "Update Ad" : "Create Ad"}
                                </button>

                            </form>

                        </div>
                    </div>

                    <div className="ui-card">

                        <div className="ui-card-header">LIVE PREVIEW</div>

                        <div className="preview-content">

                            <div className="device-toggles">
                                <button type="button" className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
                                <button type="button" className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
                            </div>

                            <div className={`banner-mockup ${device}`}>
                                {form.image ? <img src={form.image} alt="preview" /> : <span>Banner preview</span>}
                            </div>

                        </div>

                    </div>

                </section>

                <section className="table-container">

                    <div className="ui-card">

                        <div className="ui-card-header">
                            ADS LIST
                        </div>

                        <table className="custom-table">

                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Placement</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {ads.map(ad => (
                                    <tr key={ad.id}>

                                        <td>{ad.title}</td>

                                        <td><span className="tag">{ad.placement}</span></td>

                                        <td>{ad.start} - {ad.end}</td>

                                        <td>
                                            <span className={`dot ${(ad.status || "").toLowerCase()}`}></span>
                                            {ad.status}
                                        </td>

                                        <td className="actions">

                                            <button className="edit" onClick={() => handleEdit(ad)}>
                                                Edit
                                            </button>

                                            <button className="toggle" onClick={() => toggleStatus(ad.id)}>
                                                {ad.status === "Active" ? "Pause" : "Resume"}
                                            </button>

                                            <button className="delete" onClick={() => openDelete(ad.id)}>
                                                Delete
                                            </button>

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                        <div className="mobile-cards">

                            {ads.map(ad => (

                                <div className="ad-card" key={ad.id}>

                                    <div className="card-title">
                                        {ad.title}
                                    </div>

                                    <div className="card-row">
                                        <span>Placement</span>
                                        <span>{ad.placement}</span>
                                    </div>

                                    <div className="card-row">
                                        <span>Duration</span>
                                        <span>{ad.start} - {ad.end}</span>
                                    </div>

                                    <div className="card-row">
                                        <span>Status</span>
                                        <span>{ad.status}</span>
                                    </div>

                                    <div className="card-actions">

                                        <button className="edit" onClick={() => handleEdit(ad)}>Edit</button>

                                        <button className="toggle" onClick={() => toggleStatus(ad.id)}>
                                            {ad.status === "Active" ? "Pause" : "Resume"}
                                        </button>

                                        <button className="delete" onClick={() => openDelete(ad.id)}>Delete</button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </section>

            </main>

            {deleteId && (
                <div className="modal-overlay">
                    <div className="modal">

                        <h3>Delete Ad</h3>

                        <p>Are you sure you want to delete this ad?</p>

                        <div className="modal-actions">

                            <button className="cancel" onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>

                            <button className="confirm" onClick={confirmDelete}>
                                Delete
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>

    );
};

export default AdsManagement;