import React, { useMemo, useState } from "react";
import "./AdminBlogs.css";

const initialBlogs = [
  {
    id: 1,
    title: "Heart Health: Early Warning Signs You Should Not Ignore",
    category: "Cardiology",
    authorName: "Dr. Raj Sharma",
    status: "Published",
    publishedAt: "2026-04-20",
    summary:
      "A practical guide to understanding early cardiac symptoms and when to consult a specialist.",
    imageUrl:
      "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: 2,
    title: "Managing Screen Time and Digital Eye Strain",
    category: "Ophthalmology",
    authorName: "DocHub Editorial Team",
    status: "Draft",
    publishedAt: "",
    summary:
      "Simple clinical habits to protect your eyes during long working hours.",
    imageUrl:
      "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=900",
  },
];

const emptyForm = {
  title: "",
  category: "",
  authorName: "",
  summary: "",
  content: "",
  imageUrl: "",
  status: "Draft",
};

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [selectedBlog, setSelectedBlog] = useState(null);

  const filteredBlogs = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return blogs;
    }

    return blogs.filter((blog) => {
      return (
        blog.title.toLowerCase().includes(value) ||
        blog.category.toLowerCase().includes(value) ||
        blog.authorName.toLowerCase().includes(value) ||
        blog.status.toLowerCase().includes(value)
      );
    });
  }, [blogs, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBlog = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.category.trim() || !form.summary.trim()) {
      alert("Title, category and summary are required.");
      return;
    }

    const newBlog = {
      id: Date.now(),
      title: form.title.trim(),
      category: form.category.trim(),
      authorName: form.authorName.trim() || "DocHub Editorial Team",
      summary: form.summary.trim(),
      content: form.content.trim(),
      imageUrl:
        form.imageUrl.trim() ||
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=900",
      status: form.status,
      publishedAt:
        form.status === "Published" ? new Date().toISOString().slice(0, 10) : "",
    };

    setBlogs((prev) => [newBlog, ...prev]);
    setForm(emptyForm);
  };

  const toggleStatus = (blogId) => {
    setBlogs((prev) =>
      prev.map((blog) => {
        if (blog.id !== blogId) {
          return blog;
        }

        const nextStatus = blog.status === "Published" ? "Draft" : "Published";

        return {
          ...blog,
          status: nextStatus,
          publishedAt:
            nextStatus === "Published"
              ? new Date().toISOString().slice(0, 10)
              : "",
        };
      })
    );
  };

  const deleteBlog = (blogId) => {
    const confirmed = window.confirm("Are you sure you want to delete this blog?");

    if (!confirmed) {
      return;
    }

    setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
  };

  return (
    <div className="admin-blogs-page">
      <section className="admin-blogs-hero">
        <div>
          <p className="eyebrow">Content Control</p>
          <h2>Blog Management</h2>
          <p>
            Create, review and manage public medical blogs. This is dummy UI for
            now. Later we will connect it with Spring Boot APIs.
          </p>
        </div>

        <div className="blog-stats-grid">
          <div className="blog-stat-card">
            <span>Total Blogs</span>
            <strong>{blogs.length}</strong>
          </div>

          <div className="blog-stat-card">
            <span>Published</span>
            <strong>
              {blogs.filter((blog) => blog.status === "Published").length}
            </strong>
          </div>

          <div className="blog-stat-card">
            <span>Drafts</span>
            <strong>{blogs.filter((blog) => blog.status === "Draft").length}</strong>
          </div>
        </div>
      </section>

      <section className="admin-blogs-layout">
        <form className="blog-form-card" onSubmit={handleCreateBlog}>
          <div className="card-title-row">
            <div>
              <h3>Upload Blog</h3>
              <p>Add blog content manually for now.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Blog Title <span>*</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: How to manage diabetes naturally"
              />
            </label>

            <label>
              Category <span>*</span>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Cardiology, Dermatology, Nutrition..."
              />
            </label>

            <label>
              Author Name
              <input
                type="text"
                name="authorName"
                value={form.authorName}
                onChange={handleChange}
                placeholder="Doctor name or editorial team"
              />
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </label>
          </div>

          <label>
            Cover Image URL
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="Paste image URL"
            />
          </label>

          <label>
            Short Summary <span>*</span>
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              rows="3"
              placeholder="Short description shown on blog card"
            ></textarea>
          </label>

          <label>
            Full Blog Content
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows="7"
              placeholder="Write full article content here"
            ></textarea>
          </label>

          <button type="submit" className="primary-blog-btn">
            Save Dummy Blog
          </button>
        </form>

        <section className="blog-list-card">
          <div className="blog-list-header">
            <div>
              <h3>All Blogs</h3>
              <p>Search, preview, publish/unpublish or delete blogs.</p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search blogs..."
              className="blog-search-input"
            />
          </div>

          <div className="blog-table-wrapper">
            {filteredBlogs.length === 0 ? (
              <div className="empty-blog-state">
                <h4>No blogs found</h4>
                <p>Try another search or create a new blog.</p>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <article className="blog-admin-row" key={blog.id}>
                  <img src={blog.imageUrl} alt={blog.title} />

                  <div className="blog-row-main">
                    <div className="blog-row-top">
                      <span className="blog-category-pill">{blog.category}</span>
                      <span
                        className={
                          blog.status === "Published"
                            ? "blog-status published"
                            : "blog-status draft"
                        }
                      >
                        {blog.status}
                      </span>
                    </div>

                    <h4>{blog.title}</h4>
                    <p>{blog.summary}</p>

                    <div className="blog-meta-line">
                      <span>{blog.authorName}</span>
                      <span>
                        {blog.publishedAt
                          ? `Published: ${blog.publishedAt}`
                          : "Not published yet"}
                      </span>
                    </div>
                  </div>

                  <div className="blog-row-actions">
                    <button type="button" onClick={() => setSelectedBlog(blog)}>
                      Preview
                    </button>

                    <button type="button" onClick={() => toggleStatus(blog.id)}>
                      {blog.status === "Published" ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => deleteBlog(blog.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      {selectedBlog && (
        <div className="blog-preview-overlay" onClick={() => setSelectedBlog(null)}>
          <div
            className="blog-preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="preview-close-btn"
              onClick={() => setSelectedBlog(null)}
            >
              ×
            </button>

            <img src={selectedBlog.imageUrl} alt={selectedBlog.title} />

            <div className="preview-content">
              <span className="blog-category-pill">{selectedBlog.category}</span>
              <h2>{selectedBlog.title}</h2>

              <div className="preview-author">
                <span>{selectedBlog.authorName}</span>
                <span>{selectedBlog.status}</span>
              </div>

              <p className="preview-summary">{selectedBlog.summary}</p>

              <div className="preview-body">
                {selectedBlog.content ? (
                  selectedBlog.content
                    .split("\n")
                    .filter(Boolean)
                    .map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p>No full content added yet.</p>
                )}
              </div>

              <div className="preview-disclaimer">
                This dummy preview is for admin testing only. Backend save,
                approval and public publishing will be connected later.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;