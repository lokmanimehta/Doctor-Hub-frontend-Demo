import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  archiveAdminBlog,
  createAdminBlog,
  deleteAdminBlog,
  getAdminBlogById,
  getAdminBlogFilterOptions,
  getAdminBlogs,
  getAdminBlogSummary,
  publishAdminBlog,
  restoreAdminBlog,
  unpublishAdminBlog,
  updateAdminBlog
} from "../../services/adminService";

import "./AdminBlogs.css";

const PAGE_SIZE = 8;

const createEmptyForm = () => ({
  title: "",
  category: "",
  summary: "",
  content: "",

  coverImageUrl: "",
  imageAltText: "",
  removeCoverImage: false,

  authorName:
    "Sucura Editorial Team",

  authorType: "EDITORIAL_TEAM",
  status: "DRAFT",
  featured: false,

  seoTitle: "",
  seoDescription: "",

  version: null
});

const EMPTY_SUMMARY = {
  total: 0,
  draft: 0,
  published: 0,
  unpublished: 0,
  archived: 0,
  featured: 0
};

const DEFAULT_FILTER_OPTIONS = {
  statuses: [
    "DRAFT",
    "PUBLISHED",
    "UNPUBLISHED",
    "ARCHIVED"
  ],
  authorTypes: [
    "ADMIN",
    "DOCTOR",
    "EDITORIAL_TEAM"
  ],
  categories: []
};

const STATUS_LABELS = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
  ARCHIVED: "Archived"
};

const AUTHOR_TYPE_LABELS = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  EDITORIAL_TEAM: "Editorial Team"
};

const formatStatus = (status) =>
  STATUS_LABELS[status] || status || "Unknown";

const formatAuthorType = (authorType) =>
  AUTHOR_TYPE_LABELS[authorType] ||
  authorType ||
  "Unknown";

const formatDate = (timestamp) => {
  if (!timestamp) {
    return "Not available";
  }

  return new Date(timestamp).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
};

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  const responseData =
    error?.response?.data;

  if (
    responseData?.message &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    const validationMessages =
      Object.entries(responseData)
        .filter(
          ([key, value]) =>
            key !== "timestamp" &&
            key !== "status" &&
            key !== "error" &&
            typeof value === "string"
        )
        .map(
          ([field, message]) =>
            `${field}: ${message}`
        );

    if (validationMessages.length > 0) {
      return validationMessages.join(", ");
    }
  }

  return error?.message || fallback;
};

const CoverImage = ({
  src,
  alt,
  className = ""
}) => {
  const [
    failedImageSrc,
    setFailedImageSrc
  ] = useState("");

  const imageFailed =
    Boolean(src) &&
    failedImageSrc === src;

  if (!src || imageFailed) {
    return (
      <div
        className={`abm-image-placeholder ${className}`}
        aria-label="No cover image"
      >
        <span>DH</span>
        <small>No cover image</small>
      </div>
    );
  }

  return (
    <img
      key={src}
      className={className}
      src={src}
      alt={alt || "Blog cover"}
      onError={() =>
        setFailedImageSrc(src)
      }
      loading="lazy"
    />
  );
};

const AdminBlogs = () => {
  const formCardRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [blogs, setBlogs] = useState([]);
  const [summary, setSummary] =
    useState(EMPTY_SUMMARY);

  const [
    filterOptions,
    setFilterOptions
  ] = useState(DEFAULT_FILTER_OPTIONS);

  const [form, setForm] = useState(
    createEmptyForm()
  );

  const [editingBlogId, setEditingBlogId] =
    useState(null);

  const [
    originalImageUrl,
    setOriginalImageUrl
  ] = useState("");

  const [coverFile, setCoverFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [appliedSearch, setAppliedSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [
    includeArchived,
    setIncludeArchived
  ] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] =
    useState(0);

  const [totalElements, setTotalElements] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [metadataLoading, setMetadataLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionBlogId, setActionBlogId] =
    useState(null);

  const [previewBlog, setPreviewBlog] =
    useState(null);

  const [
    previewLoadingBlogId,
    setPreviewLoadingBlogId
  ] = useState(null);

  const [
    confirmation,
    setConfirmation
  ] = useState(null);

  const [toast, setToast] =
    useState(null);

  const showToast = useCallback(
    (
      message,
      type = "success"
    ) => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(
          toastTimeoutRef.current
        );
      }

      setToast({
        message,
        type
      });

      toastTimeoutRef.current =
        window.setTimeout(() => {
          setToast(null);
        }, 4200);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(
          toastTimeoutRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(
        searchInput.trim()
      );

      setPage(0);
    }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (previewBlog || confirmation) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [previewBlog, confirmation]);

  const loadMetadata = useCallback(
    async ({
      silent = false
    } = {}) => {
      try {
        if (!silent) {
          setMetadataLoading(true);
        }

        const [
          summaryResponse,
          filterResponse
        ] = await Promise.all([
          getAdminBlogSummary(),
          getAdminBlogFilterOptions()
        ]);

        setSummary({
          ...EMPTY_SUMMARY,
          ...(summaryResponse || {})
        });

        setFilterOptions({
          ...DEFAULT_FILTER_OPTIONS,
          ...(filterResponse || {}),
          statuses:
            filterResponse?.statuses ||
            DEFAULT_FILTER_OPTIONS.statuses,

          authorTypes:
            filterResponse?.authorTypes ||
            DEFAULT_FILTER_OPTIONS.authorTypes,

          categories:
            filterResponse?.categories || []
        });
      } catch (error) {
        showToast(
          getErrorMessage(
            error,
            "Unable to load blog summary."
          ),
          "error"
        );
      } finally {
        if (!silent) {
          setMetadataLoading(false);
        }
      }
    },
    [showToast]
  );

  const loadBlogs = useCallback(
    async ({
      silent = false
    } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const response =
          await getAdminBlogs({
            search: appliedSearch,
            status: statusFilter,
            category: categoryFilter,
            includeArchived,
            page,
            size: PAGE_SIZE,
            sortBy: "updatedAt",
            sortDirection: "DESC"
          });

        setBlogs(
          Array.isArray(response?.blogs)
            ? response.blogs
            : []
        );

        setTotalPages(
          Number(response?.totalPages || 0)
        );

        setTotalElements(
          Number(response?.totalElements || 0)
        );
      } catch (error) {
        setBlogs([]);

        showToast(
          getErrorMessage(
            error,
            "Unable to load blogs."
          ),
          "error"
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      appliedSearch,
      categoryFilter,
      includeArchived,
      page,
      showToast,
      statusFilter
    ]
  );

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const refreshAfterMutation =
    useCallback(async () => {
      await Promise.all([
        loadMetadata({
          silent: true
        }),
        loadBlogs({
          silent: true
        })
      ]);
    }, [loadBlogs, loadMetadata]);

  const statusCounts = useMemo(
    () => [
      {
        label: "Total blogs",
        value: summary.total,
        tone: "neutral"
      },
      {
        label: "Published",
        value: summary.published,
        tone: "success"
      },
      {
        label: "Drafts",
        value: summary.draft,
        tone: "draft"
      },
      {
        label: "Unpublished",
        value: summary.unpublished,
        tone: "warning"
      },
      {
        label: "Archived",
        value: summary.archived,
        tone: "muted"
      },
      {
        label: "Featured",
        value: summary.featured,
        tone: "accent"
      }
    ],
    [summary]
  );

  const resetForm = useCallback(() => {
    setForm(createEmptyForm());
    setEditingBlogId(null);
    setOriginalImageUrl("");
    setCoverFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  };

  const handleCreateNew = () => {
    resetForm();
    scrollToForm();
  };

  const handleFieldChange = (event) => {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    if (name === "coverImageUrl") {
      setCoverFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setForm((previous) => ({
        ...previous,
        coverImageUrl: value,
        removeCoverImage: false
      }));

      setImagePreview(
        value.trim() ||
          originalImageUrl ||
          ""
      );

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value
    }));
  };

  const inspectImageFile = (
    file
  ) =>
    new Promise((resolve, reject) => {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png"
      ];

      if (!allowedTypes.includes(file.type)) {
        reject(
          new Error(
            "Cover image must be JPG, JPEG, or PNG."
          )
        );

        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(
          new Error(
            "Cover image cannot exceed 5 MB."
          )
        );

        return;
      }

      const reader = new FileReader();

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read selected image."
          )
        );
      };

      reader.onload = () => {
        const image = new Image();

        image.onerror = () => {
          reject(
            new Error(
              "Selected image is corrupted or unsupported."
            )
          );
        };

        image.onload = () => {
          const width = image.naturalWidth;
          const height = image.naturalHeight;
          const ratio = width / height;

          if (width < 600 || height < 300) {
            reject(
              new Error(
                "Cover image must be at least 600 × 300 pixels."
              )
            );

            return;
          }

          if (ratio < 1.4 || ratio > 2.5) {
            reject(
              new Error(
                "Cover image must be landscape. Recommended size is 1200 × 630 pixels."
              )
            );

            return;
          }

          resolve({
            preview: reader.result,
            width,
            height
          });
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });

  const handleCoverFileChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const imageInfo =
          await inspectImageFile(file);

        setCoverFile(file);
        setImagePreview(
          imageInfo.preview
        );

        setForm((previous) => ({
          ...previous,
          coverImageUrl: "",
          removeCoverImage: false
        }));
      } catch (error) {
        event.target.value = "";

        setCoverFile(null);

        showToast(
          error.message,
          "error"
        );
      }
    };

  const handleRemoveImage = () => {
    const hasOriginalImage =
      Boolean(originalImageUrl);

    if (form.removeCoverImage) {
      setForm((previous) => ({
        ...previous,
        removeCoverImage: false
      }));

      setImagePreview(
        originalImageUrl
      );

      return;
    }

    setCoverFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setForm((previous) => ({
      ...previous,
      coverImageUrl: "",
      removeCoverImage:
        Boolean(
          editingBlogId &&
            hasOriginalImage
        )
    }));
  };

  const validateForm = () => {
    const title = form.title.trim();
    const category =
      form.category.trim();

    const summaryValue =
      form.summary.trim();

    const content =
      form.content.trim();

    const authorName =
      form.authorName.trim();

    if (title.length < 5) {
      return "Blog title must contain at least 5 characters.";
    }

    if (category.length < 2) {
      return "Category must contain at least 2 characters.";
    }

    if (summaryValue.length < 10) {
      return "Summary must contain at least 10 characters.";
    }

    if (!authorName) {
      return "Author name is required.";
    }

    const requiresPublishableContent =
      editingBlogId
        ? form.status === "PUBLISHED"
        : form.status === "PUBLISHED";

    if (
      requiresPublishableContent &&
      content.length < 50
    ) {
      return "Published blog content must contain at least 50 characters.";
    }

    if (
      form.coverImageUrl.trim() &&
      coverFile
    ) {
      return "Use either an uploaded image or an external image URL.";
    }

    return "";
  };

  const buildCreatePayload = () => ({
    title: form.title.trim(),
    category: form.category.trim(),
    summary: form.summary.trim(),
    content: form.content.trim(),

    coverImageUrl:
      coverFile
        ? null
        : form.coverImageUrl.trim() ||
          null,

    imageAltText:
      form.imageAltText.trim() ||
      null,

    authorName:
      form.authorName.trim(),

    authorType: form.authorType,
    status: form.status,

    featured:
      Boolean(form.featured),

    seoTitle:
      form.seoTitle.trim() ||
      null,

    seoDescription:
      form.seoDescription.trim() ||
      null
  });

  const buildUpdatePayload = () => ({
    title: form.title.trim(),
    category: form.category.trim(),
    summary: form.summary.trim(),
    content: form.content.trim(),

    coverImageUrl:
      form.removeCoverImage ||
      coverFile
        ? null
        : form.coverImageUrl.trim() ||
          null,

    removeCoverImage:
      Boolean(
        form.removeCoverImage
      ),

    imageAltText:
      form.imageAltText.trim() ||
      null,

    authorName:
      form.authorName.trim(),

    authorType: form.authorType,

    featured:
      Boolean(form.featured),

    seoTitle:
      form.seoTitle.trim() ||
      null,

    seoDescription:
      form.seoDescription.trim() ||
      null,

    version: form.version
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      showToast(
        validationMessage,
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      if (editingBlogId) {
        await updateAdminBlog(
          editingBlogId,
          {
            payload:
              buildUpdatePayload(),

            coverImage: coverFile
          }
        );

        showToast(
          "Blog updated successfully."
        );
      } else {
        await createAdminBlog({
          payload:
            buildCreatePayload(),

          coverImage: coverFile
        });

        showToast(
          form.status === "PUBLISHED"
            ? "Blog created and published successfully."
            : "Blog draft created successfully."
        );
      }

      resetForm();

      setPage(0);

      await Promise.all([
        loadMetadata({
          silent: true
        }),
        loadBlogs({
          silent: true
        })
      ]);
    } catch (error) {
      if (
        error?.response?.status === 409
      ) {
        showToast(
          "This blog was changed by another request. Reloading the latest data.",
          "error"
        );

        await refreshAfterMutation();
      } else {
        showToast(
          getErrorMessage(
            error,
            "Unable to save blog."
          ),
          "error"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditBlog = async (
    blog
  ) => {
    if (
      blog.status === "ARCHIVED"
    ) {
      showToast(
        "Restore the archived blog before editing.",
        "error"
      );

      return;
    }

    try {
      setActionBlogId(blog.id);

      const details =
        await getAdminBlogById(
          blog.id
        );

      setEditingBlogId(details.id);

      setOriginalImageUrl(
        details.coverImageUrl || ""
      );

      setImagePreview(
        details.coverImageUrl || ""
      );

      setCoverFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setForm({
        title: details.title || "",
        category:
          details.category || "",

        summary:
          details.summary || "",

        content:
          details.content || "",

        coverImageUrl:
          details.coverImageUrl || "",

        imageAltText:
          details.imageAltText || "",

        removeCoverImage: false,

        authorName:
          details.authorName || "",

        authorType:
          details.authorType ||
          "EDITORIAL_TEAM",

        status:
          details.status || "DRAFT",

        featured:
          Boolean(details.featured),

        seoTitle:
          details.seoTitle || "",

        seoDescription:
          details.seoDescription || "",

        version:
          details.version
      });

      scrollToForm();
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          "Unable to open blog for editing."
        ),
        "error"
      );
    } finally {
      setActionBlogId(null);
    }
  };

  const handlePreviewBlog = async (
    blog
  ) => {
    try {
      setPreviewLoadingBlogId(
        blog.id
      );

      const details =
        await getAdminBlogById(
          blog.id
        );

      setPreviewBlog(details);
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          "Unable to load blog preview."
        ),
        "error"
      );
    } finally {
      setPreviewLoadingBlogId(
        null
      );
    }
  };

  const openConfirmation = (
    type,
    blog
  ) => {
    const configurations = {
      publish: {
        title: "Publish blog?",
        message:
          "This blog will become visible on the public Blogs page.",
        confirmLabel: "Publish",
        danger: false
      },

      unpublish: {
        title: "Unpublish blog?",
        message:
          "The blog will immediately disappear from the public Blogs page.",
        confirmLabel: "Unpublish",
        danger: false
      },

      archive: {
        title: "Archive blog?",
        message:
          "The blog will be removed from the normal admin list and cannot be edited until restored.",
        confirmLabel: "Archive",
        danger: true
      },

      restore: {
        title: "Restore blog?",
        message:
          "The archived blog will be restored as a draft.",
        confirmLabel: "Restore",
        danger: false
      },

      delete: {
        title:
          "Permanently delete blog?",

        message:
          "This action permanently removes the blog and its uploaded cover image. This cannot be undone.",

        confirmLabel:
          "Delete permanently",

        danger: true
      }
    };

    setConfirmation({
      type,
      blog,
      ...configurations[type]
    });
  };

  const runConfirmedAction =
    async () => {
      if (!confirmation?.blog) {
        return;
      }

      const {
        blog,
        type
      } = confirmation;

      try {
        setActionBlogId(blog.id);

        let successMessage = "";

        if (type === "publish") {
          await publishAdminBlog(
            blog.id,
            blog.version
          );

          successMessage =
            "Blog published successfully.";
        }

        if (type === "unpublish") {
          await unpublishAdminBlog(
            blog.id,
            blog.version
          );

          successMessage =
            "Blog unpublished successfully.";
        }

        if (type === "archive") {
          await archiveAdminBlog(
            blog.id,
            blog.version
          );

          successMessage =
            "Blog archived successfully.";
        }

        if (type === "restore") {
          await restoreAdminBlog(
            blog.id,
            blog.version
          );

          successMessage =
            "Blog restored as draft.";
        }

        if (type === "delete") {
          await deleteAdminBlog(
            blog.id,
            blog.version
          );

          successMessage =
            "Blog permanently deleted.";
        }

        setConfirmation(null);

        if (
          previewBlog?.id === blog.id
        ) {
          setPreviewBlog(null);
        }

        if (
          editingBlogId === blog.id
        ) {
          resetForm();
        }

        showToast(successMessage);

        if (
          blogs.length === 1 &&
          page > 0
        ) {
          setPage(
            (previous) =>
              Math.max(
                previous - 1,
                0
              )
          );
        } else {
          await refreshAfterMutation();
        }
      } catch (error) {
        setConfirmation(null);

        if (
          error?.response?.status === 409
        ) {
          showToast(
            "This blog was updated by another request. The latest data has been reloaded.",
            "error"
          );

          await refreshAfterMutation();
        } else {
          showToast(
            getErrorMessage(
              error,
              "Unable to complete blog action."
            ),
            "error"
          );
        }
      } finally {
        setActionBlogId(null);
      }
    };

  const handleStatusAction = (
    blog
  ) => {
    if (
      blog.status === "PUBLISHED"
    ) {
      openConfirmation(
        "unpublish",
        blog
      );

      return;
    }

    if (
      blog.status === "ARCHIVED"
    ) {
      openConfirmation(
        "restore",
        blog
      );

      return;
    }

    openConfirmation(
      "publish",
      blog
    );
  };

  const clearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("");
    setIncludeArchived(false);
    setPage(0);
  };

  const hasActiveFilters =
    Boolean(
      searchInput.trim() ||
        statusFilter !== "ALL" ||
        categoryFilter ||
        includeArchived
    );

  return (
    <div className="abm-page">
      {toast && (
        <div
          className={`abm-toast abm-toast--${toast.type}`}
          role="status"
        >
          <span className="abm-toast-dot" />

          <p>{toast.message}</p>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <section className="abm-header">
        <div className="abm-header-copy">
          <span className="abm-eyebrow">
            Content management
          </span>

          <h1>Blog Management</h1>

          <p>
            Create, review and publish trusted
            medical content across the Doctor's
            Hub public platform.
          </p>
        </div>

        <button
          type="button"
          className="abm-primary-button abm-header-button"
          onClick={handleCreateNew}
        >
          <span>+</span>
          New blog
        </button>
      </section>

      <section
        className="abm-stats-grid"
        aria-label="Blog summary"
      >
        {statusCounts.map((item) => (
          <article
            className={`abm-stat-card abm-stat-card--${item.tone}`}
            key={item.label}
          >
            <span>{item.label}</span>

            <strong>
              {metadataLoading
                ? "—"
                : item.value ?? 0}
            </strong>
          </article>
        ))}
      </section>

      <section className="abm-workspace">
        <form
          ref={formCardRef}
          className="abm-form-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="abm-card-heading">
            <div>
              <span className="abm-section-kicker">
                {editingBlogId
                  ? "Editing content"
                  : "New content"}
              </span>

              <h2>
                {editingBlogId
                  ? "Update blog"
                  : "Create blog"}
              </h2>

              <p>
                {editingBlogId
                  ? "Update article content without changing its permanent public URL."
                  : "Save a draft or publish a complete article immediately."}
              </p>
            </div>

            {editingBlogId && (
              <button
                type="button"
                className="abm-text-button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="abm-form-section">
            <div className="abm-form-section-title">
              <span>01</span>

              <div>
                <h3>Article information</h3>
                <p>
                  Main title, category and author
                  information.
                </p>
              </div>
            </div>

            <div className="abm-form-grid">
              <label className="abm-field abm-field--full">
                <span>
                  Blog title
                  <em>*</em>
                </span>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleFieldChange}
                  maxLength={180}
                  placeholder="Enter a clear article title"
                  disabled={saving}
                />

                <small>
                  {form.title.length}/180
                </small>
              </label>

              <label className="abm-field">
                <span>
                  Category
                  <em>*</em>
                </span>

                <input
                  name="category"
                  list="abm-blog-categories"
                  value={form.category}
                  onChange={handleFieldChange}
                  maxLength={80}
                  placeholder="Example: Cardiology"
                  disabled={saving}
                />

                <datalist id="abm-blog-categories">
                  {filterOptions.categories.map(
                    (category) => (
                      <option
                        value={category}
                        key={category}
                      />
                    )
                  )}
                </datalist>
              </label>

              <label className="abm-field">
                <span>
                  Author name
                  <em>*</em>
                </span>

                <input
                  name="authorName"
                  value={form.authorName}
                  onChange={handleFieldChange}
                  maxLength={120}
                  placeholder="Author or editorial team"
                  disabled={saving}
                />
              </label>

              <label className="abm-field">
                <span>Author type</span>

                <select
                  name="authorType"
                  value={form.authorType}
                  onChange={handleFieldChange}
                  disabled={saving}
                >
                  {filterOptions.authorTypes.map(
                    (authorType) => (
                      <option
                        value={authorType}
                        key={authorType}
                      >
                        {formatAuthorType(
                          authorType
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="abm-field">
                <span>Status</span>

                {editingBlogId ? (
                  <div className="abm-readonly-field">
                    <span
                      className={`abm-status-badge abm-status-badge--${form.status.toLowerCase()}`}
                    >
                      {formatStatus(
                        form.status
                      )}
                    </span>

                    <small>
                      Use row actions to change
                      publication status.
                    </small>
                  </div>
                ) : (
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFieldChange}
                    disabled={saving}
                  >
                    <option value="DRAFT">
                      Save as draft
                    </option>

                    <option value="PUBLISHED">
                      Publish immediately
                    </option>
                  </select>
                )}
              </div>

              <label className="abm-switch-field abm-field--full">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleFieldChange}
                  disabled={saving}
                />

                <span className="abm-switch-control" />

                <span className="abm-switch-copy">
                  <strong>
                    Feature this blog
                  </strong>

                  <small>
                    Featured blogs receive priority
                    on the public Blogs page.
                  </small>
                </span>
              </label>
            </div>
          </div>

          <div className="abm-form-section">
            <div className="abm-form-section-title">
              <span>02</span>

              <div>
                <h3>Cover image</h3>
                <p>
                  Use a landscape image for consistent
                  public cards and article headers.
                </p>
              </div>
            </div>

            <div className="abm-cover-preview">
              <CoverImage
                src={imagePreview}
                alt={
                  form.imageAltText ||
                  form.title ||
                  "Blog cover preview"
                }
                className="abm-cover-preview-image"
              />

              <div className="abm-cover-preview-copy">
                <strong>
                  Recommended: 1200 × 630
                </strong>

                <span>
                  JPG or PNG, maximum 5 MB.
                </span>

                {(imagePreview ||
                  form.removeCoverImage) && (
                  <button
                    type="button"
                    className="abm-secondary-button abm-small-button"
                    onClick={handleRemoveImage}
                    disabled={saving}
                  >
                    {form.removeCoverImage
                      ? "Undo removal"
                      : "Remove image"}
                  </button>
                )}
              </div>
            </div>

            <div className="abm-form-grid">
              <label className="abm-field">
                <span>Upload image</span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleCoverFileChange}
                  disabled={saving}
                />

                {coverFile && (
                  <small>
                    Selected: {coverFile.name}
                  </small>
                )}
              </label>

              <label className="abm-field">
                <span>
                  Or external image URL
                </span>

                <input
                  type="url"
                  name="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={handleFieldChange}
                  maxLength={1200}
                  placeholder="https://example.com/image.jpg"
                  disabled={
                    saving ||
                    Boolean(coverFile)
                  }
                />
              </label>

              <label className="abm-field abm-field--full">
                <span>
                  Image alternative text
                </span>

                <input
                  name="imageAltText"
                  value={form.imageAltText}
                  onChange={handleFieldChange}
                  maxLength={300}
                  placeholder="Describe the image for accessibility"
                  disabled={saving}
                />
              </label>
            </div>
          </div>

          <div className="abm-form-section">
            <div className="abm-form-section-title">
              <span>03</span>

              <div>
                <h3>Article content</h3>
                <p>
                  Write a concise summary and complete
                  article body.
                </p>
              </div>
            </div>

            <div className="abm-form-grid">
              <label className="abm-field abm-field--full">
                <span>
                  Short summary
                  <em>*</em>
                </span>

                <textarea
                  name="summary"
                  value={form.summary}
                  onChange={handleFieldChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Short description shown on public cards"
                  disabled={saving}
                />

                <small>
                  {form.summary.length}/500
                </small>
              </label>

              <label className="abm-field abm-field--full">
                <span>
                  Full article content
                </span>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleFieldChange}
                  rows={12}
                  maxLength={1000000}
                  placeholder="Write the complete medical article here..."
                  disabled={saving}
                />

                <small>
                  {
                    form.content
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length
                  }{" "}
                  words
                </small>
              </label>
            </div>
          </div>

          <div className="abm-form-section">
            <div className="abm-form-section-title">
              <span>04</span>

              <div>
                <h3>Search information</h3>
                <p>
                  Optional metadata used by search
                  engines and social previews.
                </p>
              </div>
            </div>

            <div className="abm-form-grid">
              <label className="abm-field abm-field--full">
                <span>SEO title</span>

                <input
                  name="seoTitle"
                  value={form.seoTitle}
                  onChange={handleFieldChange}
                  maxLength={180}
                  placeholder="Defaults to the blog title"
                  disabled={saving}
                />
              </label>

              <label className="abm-field abm-field--full">
                <span>SEO description</span>

                <textarea
                  name="seoDescription"
                  value={form.seoDescription}
                  onChange={handleFieldChange}
                  rows={3}
                  maxLength={300}
                  placeholder="Defaults to the blog summary"
                  disabled={saving}
                />

                <small>
                  {form.seoDescription.length}/300
                </small>
              </label>
            </div>
          </div>

          <div className="abm-form-actions">
            {editingBlogId && (
              <button
                type="button"
                className="abm-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="abm-primary-button"
              disabled={saving}
            >
              {saving && (
                <span className="abm-button-spinner" />
              )}

              {saving
                ? "Saving..."
                : editingBlogId
                  ? "Save changes"
                  : form.status ===
                      "PUBLISHED"
                    ? "Create and publish"
                    : "Save draft"}
            </button>
          </div>
        </form>

        <section className="abm-list-card">
          <div className="abm-list-heading">
            <div>
              <span className="abm-section-kicker">
                Content library
              </span>

              <h2>All blogs</h2>

              <p>
                {totalElements} blog
                {totalElements === 1
                  ? ""
                  : "s"}{" "}
                matched.
              </p>
            </div>

            <button
              type="button"
              className="abm-secondary-button"
              onClick={() =>
                Promise.all([
                  loadMetadata(),
                  loadBlogs()
                ])
              }
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="abm-filter-panel">
            <label className="abm-search-field">
              <span className="abm-search-icon">
                ⌕
              </span>

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search title, author, category..."
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value
                );

                setPage(0);
              }}
              aria-label="Filter by status"
            >
              <option value="ALL">
                All statuses
              </option>

              {filterOptions.statuses.map(
                (status) => (
                  <option
                    value={status}
                    key={status}
                  >
                    {formatStatus(status)}
                  </option>
                )
              )}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(
                  event.target.value
                );

                setPage(0);
              }}
              aria-label="Filter by category"
            >
              <option value="">
                All categories
              </option>

              {filterOptions.categories.map(
                (category) => (
                  <option
                    value={category}
                    key={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <label className="abm-archive-filter">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(event) => {
                  setIncludeArchived(
                    event.target.checked
                  );

                  setPage(0);
                }}
              />

              <span>Include archived</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className="abm-clear-filter"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="abm-list-content">
            {loading ? (
              <div className="abm-loading-list">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      className="abm-skeleton-row"
                      key={item}
                    >
                      <div />
                      <span />
                      <span />
                    </div>
                  )
                )}
              </div>
            ) : blogs.length === 0 ? (
              <div className="abm-empty-state">
                <div className="abm-empty-icon">
                  B
                </div>

                <h3>No blogs found</h3>

                <p>
                  Change the filters or create a new
                  blog article.
                </p>

                <button
                  type="button"
                  className="abm-primary-button"
                  onClick={handleCreateNew}
                >
                  Create blog
                </button>
              </div>
            ) : (
              <div className="abm-blog-list">
                {blogs.map((blog) => {
                  const actionRunning =
                    actionBlogId === blog.id;

                  return (
                    <article
                      className="abm-blog-row"
                      key={blog.id}
                    >
                      <CoverImage
                        src={blog.coverImageUrl}
                        alt={
                          blog.imageAltText ||
                          blog.title
                        }
                        className="abm-blog-row-image"
                      />

                      <div className="abm-blog-row-content">
                        <div className="abm-blog-row-labels">
                          <span className="abm-category-badge">
                            {blog.category}
                          </span>

                          <span
                            className={`abm-status-badge abm-status-badge--${blog.status.toLowerCase()}`}
                          >
                            {formatStatus(
                              blog.status
                            )}
                          </span>

                          {blog.featured && (
                            <span className="abm-featured-badge">
                              Featured
                            </span>
                          )}
                        </div>

                        <h3>{blog.title}</h3>

                        <p>{blog.summary}</p>

                        <div className="abm-blog-meta">
                          <span>
                            {blog.authorName}
                          </span>

                          <span>
                            {blog.readTimeMinutes ||
                              1}{" "}
                            min read
                          </span>

                          <span>
                            Updated{" "}
                            {formatDate(
                              blog.updatedAt
                            )}
                          </span>

                          <span>
                            Version{" "}
                            {blog.version}
                          </span>
                        </div>
                      </div>

                      <div className="abm-row-actions">
                        <button
                          type="button"
                          className="abm-row-button"
                          onClick={() =>
                            handlePreviewBlog(
                              blog
                            )
                          }
                          disabled={
                            actionRunning ||
                            previewLoadingBlogId ===
                              blog.id
                          }
                        >
                          {previewLoadingBlogId ===
                          blog.id
                            ? "Loading..."
                            : "Preview"}
                        </button>

                        {blog.status !==
                          "ARCHIVED" && (
                          <button
                            type="button"
                            className="abm-row-button"
                            onClick={() =>
                              handleEditBlog(
                                blog
                              )
                            }
                            disabled={
                              actionRunning
                            }
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          className="abm-row-button abm-row-button--primary"
                          onClick={() =>
                            handleStatusAction(
                              blog
                            )
                          }
                          disabled={
                            actionRunning
                          }
                        >
                          {actionRunning
                            ? "Working..."
                            : blog.status ===
                                "PUBLISHED"
                              ? "Unpublish"
                              : blog.status ===
                                  "ARCHIVED"
                                ? "Restore"
                                : "Publish"}
                        </button>

                        {blog.status !==
                          "ARCHIVED" && (
                          <button
                            type="button"
                            className="abm-row-button"
                            onClick={() =>
                              openConfirmation(
                                "archive",
                                blog
                              )
                            }
                            disabled={
                              actionRunning
                            }
                          >
                            Archive
                          </button>
                        )}

                        {(blog.status ===
                          "DRAFT" ||
                          blog.status ===
                            "ARCHIVED") && (
                          <button
                            type="button"
                            className="abm-row-button abm-row-button--danger"
                            onClick={() =>
                              openConfirmation(
                                "delete",
                                blog
                              )
                            }
                            disabled={
                              actionRunning
                            }
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {!loading &&
            totalPages > 0 && (
              <div className="abm-pagination">
                <p>
                  Page {page + 1} of{" "}
                  {totalPages}
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (previous) =>
                          Math.max(
                            previous - 1,
                            0
                          )
                      )
                    }
                    disabled={page === 0}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (previous) =>
                          Math.min(
                            previous + 1,
                            totalPages - 1
                          )
                      )
                    }
                    disabled={
                      page >=
                      totalPages - 1
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </section>
      </section>

      {previewBlog && (
        <div
          className="abm-modal-overlay"
          onMouseDown={() =>
            setPreviewBlog(null)
          }
        >
          <article
            className="abm-preview-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="abm-modal-close"
              onClick={() =>
                setPreviewBlog(null)
              }
              aria-label="Close preview"
            >
              ×
            </button>

            <CoverImage
              src={previewBlog.coverImageUrl}
              alt={
                previewBlog.imageAltText ||
                previewBlog.title
              }
              className="abm-preview-image"
            />

            <div className="abm-preview-content">
              <div className="abm-preview-labels">
                <span className="abm-category-badge">
                  {previewBlog.category}
                </span>

                <span
                  className={`abm-status-badge abm-status-badge--${previewBlog.status.toLowerCase()}`}
                >
                  {formatStatus(
                    previewBlog.status
                  )}
                </span>

                {previewBlog.featured && (
                  <span className="abm-featured-badge">
                    Featured
                  </span>
                )}
              </div>

              <h2>{previewBlog.title}</h2>

              <div className="abm-preview-meta">
                <span>
                  {previewBlog.authorName}
                </span>

                <span>
                  {
                    previewBlog.readTimeMinutes
                  }{" "}
                  min read
                </span>

                <span>
                  {previewBlog.publishedAt
                    ? `Published ${formatDate(
                        previewBlog.publishedAt
                      )}`
                    : "Not currently published"}
                </span>
              </div>

              <p className="abm-preview-summary">
                {previewBlog.summary}
              </p>

              <div className="abm-preview-body">
                {previewBlog.content
                  ?.split("\n")
                  .map(
                    (paragraph) =>
                      paragraph.trim()
                  )
                  .filter(Boolean)
                  .map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p key={index}>
                        {paragraph}
                      </p>
                    )
                  )}
              </div>

              <div className="abm-preview-footer">
                <div>
                  <strong>SEO title</strong>
                  <span>
                    {previewBlog.seoTitle}
                  </span>
                </div>

                <div>
                  <strong>
                    SEO description
                  </strong>

                  <span>
                    {
                      previewBlog.seoDescription
                    }
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

      {confirmation && (
        <div
          className="abm-modal-overlay"
          onMouseDown={() =>
            setConfirmation(null)
          }
        >
          <div
            className="abm-confirm-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={`abm-confirm-icon ${
                confirmation.danger
                  ? "abm-confirm-icon--danger"
                  : ""
              }`}
            >
              !
            </div>

            <h2>{confirmation.title}</h2>

            <p>{confirmation.message}</p>

            <div className="abm-confirm-blog">
              <strong>
                {confirmation.blog.title}
              </strong>

              <span>
                {formatStatus(
                  confirmation.blog.status
                )}{" "}
                · Version{" "}
                {confirmation.blog.version}
              </span>
            </div>

            <div className="abm-confirm-actions">
              <button
                type="button"
                className="abm-secondary-button"
                onClick={() =>
                  setConfirmation(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmation.danger
                    ? "abm-danger-button"
                    : "abm-primary-button"
                }
                onClick={
                  runConfirmedAction
                }
                disabled={
                  actionBlogId ===
                  confirmation.blog.id
                }
              >
                {actionBlogId ===
                confirmation.blog.id
                  ? "Working..."
                  : confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;