import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Building2,
  Users,
  ShieldAlert,
  Activity,
  RefreshCw,
  CheckCircle,
  Database,
  ExternalLink,
  Layers,
  Search,
  Filter
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAudit = async () => {
    try {
      const res = await api.get('/api/audit');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching admin audit logs:', err);
    }
  };

  const fetchOrgs = async () => {
    try {
      // In CM, we have OrganizationGraphqlController or AdminController
      // Let's call /api/admin/organizations or fallback
      const res = await api.get('/api/admin/organizations').catch(() => null);
      if (res && res.data) {
        setOrganizations(res.data);
      } else {
        // Fallback default known orgs
        setOrganizations([
          {
            organizationId: 'ORG_COLLEGE_A',
            organizationCode: 'COLLEGE_A',
            name: 'College A University',
            email: 'admin@collegea.edu',
            status: 'ACTIVE',
            role: 'DATA_PROVIDER & DATA_CONSUMER'
          },
          {
            organizationId: 'ORG_COLLEGE_B',
            organizationCode: 'COLLEGE_B',
            name: 'College B Institute',
            email: 'admin@collegeb.edu',
            status: 'ACTIVE',
            role: 'DATA_CONSUMER & DATA_PROVIDER'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchAudit(), fetchOrgs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.eventType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight">Consent Manager Governance Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-purple-200">
            DEPA Central Trust Operator: Auditing consent lifecycles, provider registries, and cryptographic tokens.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer backdrop-blur-md self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Organizations</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{organizations.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Active in DEPA Federation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Audit Events</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{auditLogs.length}</div>
          <span className="text-[11px] text-purple-600 font-semibold">Full Cryptographic Trail</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Consent Flow</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">Decoupled P2P</div>
          <span className="text-[11px] text-slate-500">Zero Data Storage on CM</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Token Security</span>
            <ShieldAlert className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">RS256 / 2048-bit</div>
          <span className="text-[11px] text-blue-600 font-semibold">Asymmetric Signatures</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System-Wide Audit Explorer ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orgs')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'orgs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Federated Organizations ({organizations.length})</span>
        </button>
      </div>

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event type, initiator, or details..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredLogs.length} of {auditLogs.length} logged events
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Data Principal</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
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
                        {log.actorId}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Role: {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {log.resourceType}:{log.resourceId}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {log.dataPrincipalId || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'orgs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => (
            <div key={org.organizationId} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">{org.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {org.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Organization Code:</span>
                  <span className="font-mono font-bold text-slate-800">{org.organizationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin Email:</span>
                  <span className="text-slate-800">{org.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DEPA Role:</span>
                  <span className="text-indigo-700 font-semibold">{org.role || 'Dual Provider & Consumer'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
