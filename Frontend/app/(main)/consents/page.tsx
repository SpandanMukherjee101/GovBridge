"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  XCircle,
  FileCheck2,
  Clock
} from "lucide-react";

export default function ConsentsPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/interoperability/consents");
      setConsents(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load consents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "CITIZEN" || !user?.role) {
      fetchConsents();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAction = async (id: number, action: 'grant' | 'reject' | 'revoke', reason?: string) => {
    try {
      const body = reason ? JSON.stringify({ reason }) : undefined;
      const headers = reason ? { "Content-Type": "application/json" } : undefined;
      
      await apiFetch(`/interoperability/consents/${id}/${action}`, {
        method: "POST",
        body,
        headers
      });
      
      // Refresh
      fetchConsents();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} consent`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
      </div>
    );
  }

  if (user?.role && user.role !== "CITIZEN") {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <ShieldAlert className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Not Authorized</h2>
        <p className="text-gray-500 max-w-md mt-2">
          The Consents portal is designed for Citizens to manage data exchange permissions.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Active</span>;
      case 'PENDING':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending Request</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>;
      case 'REVOKED':
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle className="w-3 h-3"/> Revoked</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Sharing Consents</h1>
          <p className="text-gray-500 mt-1">Manage cross-departmental data exchange requests securely.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {consents.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <KeyRound className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Consents Found</h3>
            <p className="text-gray-500 max-w-sm mt-1">
              You haven't received any data sharing requests from government departments yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {consents.map((consent, idx) => (
            <ScrollReveal key={consent.id} delay={idx * 0.1}>
              <Card className={`overflow-hidden transition-all hover:shadow-md ${consent.status === 'PENDING' ? 'border-yellow-200 ring-1 ring-yellow-100' : ''}`}>
                <div className={`h-1.5 w-full ${
                  consent.status === 'ACTIVE' ? 'bg-green-500' : 
                  consent.status === 'PENDING' ? 'bg-yellow-400' : 
                  consent.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-gov-blue" />
                      {consent.requesting_department || 'Department Request'} 
                      <span className="text-xs text-gray-400 font-normal ml-2">(App ID: {consent.application_id})</span>
                    </CardTitle>
                    {getStatusBadge(consent.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Purpose</h4>
                    <p className="text-gray-900 font-medium">{consent.purpose || 'Not specified'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Source System</h4>
                      <p className="text-gray-900 text-sm">{consent.source_system || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Requested Scopes</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {consent.scopes ? consent.scopes.map((s: string, i: number) => (
                          <span key={i} className="text-[10px] bg-gov-blue/10 text-gov-blue-dark px-2 py-0.5 rounded-sm font-medium">
                            {s}
                          </span>
                        )) : <span className="text-sm text-gray-500">None</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 flex justify-between items-center pt-2 border-t border-gray-50">
                    <span>Requested: {new Date(consent.created_at).toLocaleDateString()}</span>
                    {consent.expires_at && <span>Expires: {new Date(consent.expires_at).toLocaleDateString()}</span>}
                  </div>

                  {consent.status === 'REJECTED' && consent.rejection_reason && (
                    <div className="bg-red-50 text-red-800 p-2 rounded text-xs mt-2 border border-red-100">
                      <strong>Rejection Reason:</strong> {consent.rejection_reason}
                    </div>
                  )}

                  {consent.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 pt-2">
                      {rejectingId === consent.id ? (
                        <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-100">
                          <label className="text-xs font-semibold text-red-900">Reason for rejection (Optional):</label>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-2 bg-white text-gray-900 border border-red-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            rows={2}
                            placeholder="I do not want to share my data..."
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <Button 
                              onClick={() => {
                                handleAction(consent.id, 'reject', rejectReason || "User declined sharing");
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                            >
                              Confirm Rejection
                            </Button>
                            <Button 
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleAction(consent.id, 'grant')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            Grant
                          </Button>
                          <Button 
                            onClick={() => setRejectingId(consent.id)}
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {(consent.status === 'REVOKED' || consent.status === 'REJECTED') && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => {
                          if (confirm("Are you sure you want to re-grant this consent?")) {
                            handleAction(consent.id, 'grant');
                          }
                        }}
                        variant="outline"
                        className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                      >
                        Re-grant Access
                      </Button>
                    </div>
                  )}

                  {consent.status === 'ACTIVE' && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => {
                          if (confirm("Are you sure you want to revoke this active consent? This may halt associated application processes.")) {
                            handleAction(consent.id, 'revoke');
                          }
                        }}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Revoke Access
                      </Button>
                    </div>
                  )}
                  
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
