import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Bell,
  Clock,
  Shield,
  FileText,
  Building,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Ban,
  Activity,
  Layers,
  Send,
  Eye,
  AlertTriangle
} from 'lucide-react';

export default function StudentDashboard({ activeTab, setActiveTab, setUnreadCount }) {
  const { user } = useAuth();
  
  // Data states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [consents, setConsents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal state for issued grant
  const [issuedGrant, setIssuedGrant] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch pending requests
  const fetchPending = async () => {
    try {
      const res = await api.get('/api/consents/pending?page=0&size=20');
      const items = res.data.content || res.data || [];
      setPendingRequests(items);
    } catch (err) {
      console.error('Error fetching pending consents:', err);
    }
  };

  // Fetch active consents
  const fetchConsents = async () => {
    try {
      const res = await api.get('/api/consents?page=0&size=20');
      const items = res.data.content || res.data || [];
      setConsents(items);
    } catch (err) {
      console.error('Error fetching consents:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
      const countRes = await api.get('/api/notifications/unread-count');
      setUnreadCount(countRes.data?.unreadCount ?? 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Fetch personal audit trail
  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/api/audit/my-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchPending(), fetchConsents(), fetchNotifications(), fetchAuditLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000); // Polling every 10s for real-time updates
    return () => clearInterval(interval);
  }, []);

  // Approve action
  const handleApprove = async (requestId) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/api/consents/${requestId}/approve`, {});
      setIssuedGrant(res.data);
      setMessage({ type: 'success', text: `Consent approved! Access Grant ${res.data.grantId} issued.` });
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject action
  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to deny this consent request?')) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await api.post(`/api/consents/${requestId}/reject`);
      setMessage({ type: 'success', text: 'Consent request denied.' });
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke action
  const handleRevoke = async (consentId) => {
    if (!window.confirm('Revoke this consent? Associated access grants will become immediately invalid!')) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await api.post(`/api/consents/${consentId}/revoke`);
      setMessage({ type: 'success', text: 'Consent revoked successfully.' });
      await loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Revocation failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Profile Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight">{user?.name || 'Student Portal'}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Active Principal
            </span>
          </div>
          <p className="text-sm text-indigo-200">
            Registered Student ID: <strong className="text-white font-mono">{user?.externalIdentityId || 'S1001'}</strong> | Email: <span className="text-white">{user?.email}</span>
          </p>
          <p className="text-xs text-indigo-300/80 mt-1">
            DEPA Trust Model: You retain absolute sovereign control over what academic data can be accessed, by whom, and for how long.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer backdrop-blur-md self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live State</span>
        </button>
      </div>

      {/* Global Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Pending Consent Requests</span>
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-black animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Active Consents &amp; Grants</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
            {consents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'notices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notices &amp; Notifications</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600 font-bold">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Auditable Trail (DEPA Principle D)</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Pending Consent Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Requests Awaiting Your Consent ({pendingRequests.length})
            </h2>
            <span className="text-xs text-slate-500">
              Only approved requests allow data consumers to initiate direct P2P access.
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Pending Requests</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You have reviewed all incoming consent requests. When an organization (e.g., College B) requests your academic data, it will appear here for your explicit authorization.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.consentRequestId || req.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {req.consentRequestId || req.id}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expires: {new Date(req.expiresAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Consumer:</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {req.requesterOrganizationCode || req.requesterOrgCode || 'COLLEGE_B'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Purpose of Access
                      </span>
                      <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        "{req.purpose}"
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Data Provider (Source)
                      </span>
                      <div className="text-sm font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                        <Building className="w-4 h-4 text-indigo-600" />
                        <span>{req.providerOrganizationCode || req.providerOrgCode || 'COLLEGE_A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Requested Academic Attributes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(req.requestedFields || []).map((field, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleReject(req.consentRequestId || req.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-slate-300 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Deny Access</span>
                    </button>

                    <button
                      onClick={() => handleApprove(req.consentRequestId || req.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve &amp; Issue Grant</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Consents & Grants */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Active Consents &amp; Granted Authorizations ({consents.length})
            </h2>
          </div>

          {consents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Active Consents</h3>
              <p className="text-xs text-slate-500 mt-1">
                Approved consent grants will be listed here with options to revoke access at any time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {consents.map((c) => (
                <div
                  key={c.consentId || c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        Consent ID: {c.consentId || c.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevoke(c.consentId || c.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Revoke Consent</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Consumer:</span>
                      <span className="font-semibold text-slate-800">{c.requesterOrganizationCode || 'COLLEGE_B'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Provider:</span>
                      <span className="font-semibold text-slate-800">{c.providerOrganizationCode || 'COLLEGE_A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Created At:</span>
                      <span className="font-semibold text-slate-800">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Approved Scope Fields:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(c.approvedFields || c.requestedFields || []).map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Notice & Notification Center (DEPA Principle E) */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Notice &amp; Notification Feed (DEPA Principle E)
              </h2>
              <p className="text-xs text-slate-500">
                Real-time alerts informing you about consent requests, sharing events, and status updates.
              </p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
              <p className="text-xs text-slate-500 mt-1">
                You will receive real-time notifications here when requests are created or data is transferred.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    n.read
                      ? 'bg-white border-slate-200 opacity-80'
                      : 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === 'NEW_CONSENT_REQUEST'
                          ? 'bg-amber-100 text-amber-700'
                          : n.type === 'DATA_SHARED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : n.type === 'CONSENT_APPROVED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {n.type === 'NEW_CONSENT_REQUEST' && <Inbox className="w-5 h-5" />}
                      {n.type === 'DATA_SHARED' && <Send className="w-5 h-5" />}
                      {n.type === 'CONSENT_APPROVED' && <CheckCircle2 className="w-5 h-5" />}
                      {n.type === 'CONSENT_REVOKED' && <Ban className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400">
                        {n.requestingOrg && <span>Entity: <strong>{n.requestingOrg}</strong></span>}
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkNotificationRead(n.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex-shrink-0 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Auditable Consent Trail (DEPA Principle D) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Personal Audit Trail (DEPA Principle D)
              </h2>
              <p className="text-xs text-slate-500">
                Full end-to-end traceability answering: <strong>Who requested access, What was shared, and When</strong>.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start">
              Principal: {user?.externalIdentityId || 'S1001'}
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Audit Events Recorded Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Every consent event and direct data transfer is logged immutably.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Timestamp (When)</th>
                      <th className="py-3 px-4">Event Stage</th>
                      <th className="py-3 px-4">Initiator / Requester (Who)</th>
                      <th className="py-3 px-4">Target Resource</th>
                      <th className="py-3 px-4">Traceability Details (What)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              log.eventType.includes('DATA_')
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : log.eventType.includes('APPROVED')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.eventType.includes('REVOKED') || log.eventType.includes('DENIED')
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {log.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {log.actorId || 'SYSTEM'}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Org: {log.organizationId || 'P2P Network'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {log.resourceType}: {log.resourceId}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-md">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Access Grant Issued Details */}
      {issuedGrant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">Cryptographic Access Grant Issued</h3>
              </div>
              <button
                onClick={() => setIssuedGrant(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600">
              The Consent Manager has cryptographically signed a verifiable RS256 Access Token.
              The consumer can now directly present this token to Provider College A to retrieve the authorized records via Diffie-Hellman encrypted peer-to-peer channel.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Access Grant ID:</span>
                <span className="font-mono font-bold text-indigo-700">{issuedGrant.grantId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(issuedGrant.expiresAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Signed RS256 Access Token (JWT):</span>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={issuedGrant.accessToken}
                    className="w-full font-mono text-[11px] bg-white border border-slate-300 rounded-lg p-2 pr-10 text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(issuedGrant.accessToken)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Copy Token"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIssuedGrant(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close &amp; View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
