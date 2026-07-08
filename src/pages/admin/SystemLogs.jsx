import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminSystemLogs } from "../../services/adminService";
import "./SystemLogs.css";

const PAGE_SIZE = 10;

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalLogs: 0,
    criticalLogs: 0,
    failedLogs: 0,
    filteredLogs: 0
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const safeTotalPages = useMemo(() => {
    return totalPages <= 0 ? 1 : totalPages;
  }, [totalPages]);

  const fetchLogs = useCallback(
    async (showRefreshState = false) => {
      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getAdminSystemLogs({
          search,
          role: roleFilter,
          module: moduleFilter,
          status: statusFilter,
          severity: severityFilter,
          fromDateTime: fromDate,
          toDateTime: toDate,
          page: currentPage - 1,
          size: PAGE_SIZE
        });

        setLogs(response?.content || []);
        setSummary(
          response?.summary || {
            totalLogs: 0,
            criticalLogs: 0,
            failedLogs: 0,
            filteredLogs: 0
          }
        );
        setTotalPages(response?.totalPages || 0);
        setTotalElements(response?.totalElements || 0);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load system logs.";

        setError(message);
        setLogs([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      search,
      roleFilter,
      moduleFilter,
      statusFilter,
      severityFilter,
      fromDate,
      toDate,
      currentPage
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "0";
    }

    return new Intl.NumberFormat("en-IN").format(Number(value));
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(Number(value));

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const isCriticalRow = (log) => {
    if (!log) return false;

    const severity = String(log.severity || "").toUpperCase();
    const status = String(log.status || "").toLowerCase();
    const action = String(log.action || "").toLowerCase();

    return (
      severity === "CRITICAL" ||
      status === "failed" ||
      action.includes("failed login") ||
      action.includes("bulk delete")
    );
  };

  const getSeverityClass = (severity) => {
    const value = String(severity || "INFO").toLowerCase();
    return `slg-pill slg-severity-${value}`;
  };

  const getStatusClass = (status) => {
    const value = String(status || "Success").toLowerCase();
    return `slg-pill slg-status-${value}`;
  };

  const safeValue = (value, fallback = "—") => {
    if (value === null || value === undefined || String(value).trim() === "") {
      return fallback;
    }

    return value;
  };

  const copyText = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard permission blocked. Ignore silently.
    }
  };

  const handleReset = () => {
    setSearch("");
    setRoleFilter("All");
    setModuleFilter("All");
    setStatusFilter("All");
    setSeverityFilter("All");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const buildCsvValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return `"${String(value).replaceAll('"', '""')}"`;
  };

  const fetchExportLogs = async () => {
    const response = await getAdminSystemLogs({
      search,
      role: roleFilter,
      module: moduleFilter,
      status: statusFilter,
      severity: severityFilter,
      fromDateTime: fromDate,
      toDateTime: toDate,
      page: 0,
      size: 500
    });

    return response?.content || [];
  };

  const exportCSV = async () => {
    try {
      setExporting(true);

      const exportLogs = await fetchExportLogs();

      const headers = [
        "ID",
        "User",
        "Role",
        "Module",
        "Action",
        "Severity",
        "Status",
        "IP",
        "Device",
        "Session ID",
        "Date"
      ];

      const rows = exportLogs.map((log) =>
        [
          log.id,
          log.user,
          log.role,
          log.module,
          log.action,
          log.severity,
          log.status,
          log.ip,
          log.device,
          log.sessionId,
          formatDateTime(log.dateTime)
        ]
          .map(buildCsvValue)
          .join(",")
      );

      const csvContent = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
      });

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "Sucura_System_Logs.csv";
      anchor.click();

      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportJSON = async () => {
    try {
      setExporting(true);

      const exportLogs = await fetchExportLogs();

      const blob = new Blob([JSON.stringify(exportLogs, null, 2)], {
        type: "application/json;charset=utf-8;"
      });

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "Sucura_System_Logs.json";
      anchor.click();

      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="system-logs-container">
      <div className="slg-header">
        <div>
          <p className="slg-kicker">Audit Center</p>
          <h1>System Logs</h1>
          <p>
            Track login activity, failed attempts, admin actions, feedback
            updates and support ticket audit events.
          </p>
        </div>

        <button
          type="button"
          className="slg-refresh-btn"
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      <div className="slg-retention-banner">
        Logs are retained for 90 days as per platform audit policy.
      </div>

      {error && (
        <div className="slg-error-banner">
          <strong>Unable to load logs</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="slg-summary-grid">
        <SummaryCard
          label="Total Logs"
          value={formatNumber(summary.totalLogs)}
          helper="Available in retention window"
        />
        <SummaryCard
          label="Critical"
          value={formatNumber(summary.criticalLogs)}
          helper="Critical severity events"
          tone="danger"
        />
        <SummaryCard
          label="Failed"
          value={formatNumber(summary.failedLogs)}
          helper="Failed login or action events"
          tone="warning"
        />
        <SummaryCard
          label="Filtered"
          value={formatNumber(summary.filteredLogs)}
          helper={`${formatNumber(totalElements)} result(s) matched`}
        />
      </div>

      <div className="slg-filter-card">
        <div className="slg-filter-grid">
          <div className="slg-field slg-search-field">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search user, action, module, IP..."
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
            />
          </div>

          <div className="slg-field">
            <label>From</label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(event) => updateFilter(setFromDate, event.target.value)}
            />
          </div>

          <div className="slg-field">
            <label>To</label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(event) => updateFilter(setToDate, event.target.value)}
            />
          </div>

          <div className="slg-field">
            <label>Role</label>
            <select
              value={roleFilter}
              onChange={(event) => updateFilter(setRoleFilter, event.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Patient">Patient</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="slg-field">
            <label>Module</label>
            <select
              value={moduleFilter}
              onChange={(event) =>
                updateFilter(setModuleFilter, event.target.value)
              }
            >
              <option value="All">All Modules</option>
              <option value="Login">Login</option>
              <option value="Auth">Auth</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Patient">Patient</option>
              <option value="Appointment">Appointment</option>
              <option value="Feedback">Feedback</option>
              <option value="Support">Support</option>
              <option value="Hospital">Hospital</option>
              <option value="Lab">Lab</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="slg-field">
            <label>Severity</label>
            <select
              value={severityFilter}
              onChange={(event) =>
                updateFilter(setSeverityFilter, event.target.value)
              }
            >
              <option value="All">All Severity</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="slg-field">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(event) =>
                updateFilter(setStatusFilter, event.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Warning">Warning</option>
            </select>
          </div>

          <button
            type="button"
            className="slg-reset-btn"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="slg-table-card">
        <div className="slg-table-header">
          <div>
            <h2>Audit Events</h2>
            <p>
              Showing page {currentPage} of {safeTotalPages}
            </p>
          </div>
        </div>

        <div className="slg-table-wrapper slg-desktop-table">
          <table className="slg-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Severity</th>
                <th>Status</th>
                <th>IP</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div className="slg-empty-row">Loading system logs...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="slg-empty-row">No logs found.</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className={isCriticalRow(log) ? "slg-critical-row" : ""}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td>{safeValue(log.id)}</td>
                    <td>
                      <div className="slg-user-cell">
                        <strong>{safeValue(log.user)}</strong>
                        <span>{safeValue(log.role)}</span>
                      </div>
                    </td>
                    <td>{safeValue(log.module)}</td>
                    <td>{safeValue(log.action)}</td>
                    <td><span className={getSeverityClass(log.severity)}>{safeValue(log.severity)}</span></td>
                    <td><span className={getStatusClass(log.status)}>{safeValue(log.status)}</span></td>
                    <td onClick={(e) => { e.stopPropagation(); copyText(log.ip); }}>{safeValue(log.ip)}</td>
                    <td>{formatDateTime(log.dateTime)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="slg-mobile-log-list">
          {loading ? (
            <div className="slg-mobile-empty">Loading system logs...</div>
          ) : logs.length === 0 ? (
            <div className="slg-mobile-empty">No logs found.</div>
          ) : (
            logs.map((log) => (
              <button
                type="button"
                key={log.id}
                className={`slg-mobile-log-card ${isCriticalRow(log) ? "slg-mobile-critical" : ""}`}
                onClick={() => setSelectedLog(log)}
              >
                <div className="slg-mobile-log-top">
                  <div>
                    <span>ID</span>
                    <strong>{safeValue(log.id)}</strong>
                  </div>
                  <span className={getSeverityClass(log.severity)}>{safeValue(log.severity)}</span>
                </div>

                <div className="slg-mobile-log-grid">
                  <div><span>User</span><strong>{safeValue(log.user)}</strong></div>
                  <div><span>Role</span><strong>{safeValue(log.role)}</strong></div>
                  <div><span>Module</span><strong>{safeValue(log.module)}</strong></div>
                  <div><span>Action</span><strong>{safeValue(log.action)}</strong></div>
                  <div><span>Status</span><strong>{safeValue(log.status)}</strong></div>
                  <div><span>IP</span><strong>{safeValue(log.ip)}</strong></div>
                  <div><span>Date</span><strong>{formatDateTime(log.dateTime)}</strong></div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="slg-footer-actions">
        <div className="slg-pagination">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Prev
          </button>

          <span>
            Page {currentPage} of {safeTotalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= safeTotalPages || loading}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>

        <div className="slg-export-actions">
          <button
            type="button"
            className="slg-export-btn slg-export-dark"
            onClick={exportCSV}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            type="button"
            className="slg-export-btn slg-export-blue"
            onClick={exportJSON}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export JSON"}
          </button>
        </div>
      </div>

      {selectedLog && (
        <div
          className="slg-modal-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="slg-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="slg-modal-header">
              <div>
                <p>Audit Event</p>
                <h3>{selectedLog.id}</h3>
              </div>

              <button type="button" onClick={() => setSelectedLog(null)}>
                ×
              </button>
            </div>

            <div className="slg-modal-body">
              <ModalRow label="User" value={`${safeValue(selectedLog.user)} (${safeValue(selectedLog.role)})`} />
              <ModalRow label="Module" value={selectedLog.module} />
              <ModalRow label="Action" value={selectedLog.action} />
              <ModalRow label="Description" value={selectedLog.description} />
              <ModalRow label="Severity" value={selectedLog.severity} />
              <ModalRow label="Status" value={selectedLog.status} />
              <ModalRow label="Before" value={selectedLog.beforeValue || "—"} />
              <ModalRow label="After" value={selectedLog.afterValue || "—"} />
              <ModalRow label="IP Address" value={selectedLog.ip || "—"} />
              <ModalRow label="Device" value={selectedLog.device || "—"} />
              <ModalRow label="Session" value={selectedLog.sessionId || "—"} />
              <ModalRow label="Timestamp" value={formatDateTime(selectedLog.dateTime)} />
            </div>

            <div className="slg-modal-footer">
              <button type="button" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ label, value, helper, tone }) => (
  <div className={`slg-summary-card ${tone ? `slg-summary-${tone}` : ""}`}>
    <p>{label}</p>
    <h3>{value}</h3>
    <span>{helper}</span>
  </div>
);

const ModalRow = ({ label, value }) => (
  <div className="slg-modal-row">
    <span>{label}</span>
    <strong>{value || "—"}</strong>
  </div>
);