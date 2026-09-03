"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [application, setApplication] = useState<any>(null);
  const [mockData, setMockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [consentStatus, setConsentStatus] = useState<string>("ACTIVE");
  const { user } = useAuth();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await apiFetch(`/applications/applications/${resolvedParams.id}`);
        setApplication(data.application || data);
        
        let hasRevokedConsent = false;
        try {
          const consentsData = await apiFetch(`/interoperability/consents?applicationId=${resolvedParams.id}`);
          const consents = Array.isArray(consentsData) ? consentsData : consentsData.data || [];
          // If any consent for this application is REVOKED or REJECTED, we block data access
          if (consents.some((c: any) => c.status === 'REVOKED' || c.status === 'REJECTED')) {
            hasRevokedConsent = true;
            setConsentStatus("REVOKED");
          } else if (consents.some((c: any) => c.status === 'PENDING')) {
            setConsentStatus("PENDING");
          }
        } catch (e) {
          // Ignore consent fetch errors if any
        }

        // Load mock data from prototype storage only if consent is not revoked
        if (typeof window !== 'undefined' && !hasRevokedConsent) {
          const stored = localStorage.getItem(`applicationData_${resolvedParams.id}`);
          if (stored) setMockData(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load application details", err);
      }
      try {
        const timelineData = await apiFetch(`/applications/applications/${resolvedParams.id}/timeline`);
        const timelineItems = Array.isArray(timelineData) ? timelineData : timelineData.data || [];
        setTimeline(timelineItems);
      } catch (e) {
        // Ignore timeline fetch errors
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading details...</div>;
  }

  if (!application) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Application Not Found</h2>
        <Link href="/applications">
          <Button variant="outline">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "REJECTED": return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    try {
      if (action === 'reject' && !rejectReason.trim()) {
        alert("Please enter a rejection reason");
        return;
      }

      const body = action === 'reject' ? JSON.stringify({ reason: rejectReason }) : undefined;
      await apiFetch(`/applications/applications/${resolvedParams.id}/${action}`, {
        method: 'POST',
        body
      });
      // Refresh the application details and timeline
      const data = await apiFetch(`/applications/applications/${resolvedParams.id}`);
      setApplication(data.application || data);
      
      try {
        const timelineData = await apiFetch(`/applications/applications/${resolvedParams.id}/timeline`);
        const timelineItems = Array.isArray(timelineData) ? timelineData : timelineData.data || [];
        setTimeline(timelineItems);
      } catch (e) {
        // Ignore error
      }
    } catch (err: any) {
      alert(`Failed to ${action} application: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ScrollReveal>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/applications">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {application.service_type?.replace(/_/g, ' ') || 'Application Details'}
            </h1>
            <p className="text-gray-500">ID: {application.id}</p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal delay={0.1} className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Applicant ID</p>
                  <p className="font-medium">{application.citizen_id || application.applicant_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">
                    {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Data Payload</p>
                  {consentStatus === 'REVOKED' ? (
                    <div className="mt-2 bg-red-50 text-red-800 p-4 rounded-md text-sm border border-red-100 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      Access to applicant data has been revoked or rejected.
                    </div>
                  ) : consentStatus === 'PENDING' ? (
                    <div className="mt-2 bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm border border-yellow-100 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      Waiting for applicant to grant data access consent.
                    </div>
                  ) : (
                    <pre className="mt-2 bg-white text-gray-900 p-4 rounded-md text-sm overflow-auto border border-gray-100">
                      {mockData ? JSON.stringify(mockData, null, 2) : application.data ? JSON.stringify(application.data, null, 2) : "No detailed data available for this application yet."}
                    </pre>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.2} direction="left">
          <Card>
            <CardHeader>
              <CardTitle>Status Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                {getStatusIcon(application.status)}
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <p className="font-bold text-gray-900">{application.status || 'PENDING'}</p>
                </div>
              </div>

              {application.status === 'REJECTED' && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">
                    {timeline.find(t => t.status === 'REJECTED' && t.type === 'status_change')?.notes?.replace('Rejected: ', '') || "No reason provided."}
                  </p>
                </div>
              )}

              {(user?.role === "OFFICER" || user?.role === "ADMIN") && application.status === "SUBMITTED" && (
                <div className="space-y-3 mt-8 pt-6 border-t border-gray-100">
                  {(consentStatus === 'REVOKED' || consentStatus === 'PENDING') && (
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-xs border border-yellow-200 mb-4">
                      Application actions are disabled because applicant data consent is {consentStatus === 'REVOKED' ? 'revoked' : 'pending'}.
                    </div>
                  )}
                  <Button 
                    onClick={() => handleAction('approve')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={rejecting || consentStatus === 'REVOKED' || consentStatus === 'PENDING'}
                  >
                    Approve Application
                  </Button>
                  
                  {rejecting ? (
                    <div className="space-y-2 mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                      <label className="text-sm font-medium text-red-900">Reason for rejection:</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2 bg-white text-gray-900 border border-red-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        rows={3}
                        placeholder="Please provide details..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAction('reject')}
                          variant="destructive"
                          className="flex-1"
                        >
                          Confirm Rejection
                        </Button>
                        <Button 
                          onClick={() => {
                            setRejecting(false);
                            setRejectReason("");
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="destructive" 
                      onClick={() => setRejecting(true)}
                      className="w-full"
                      disabled={consentStatus === 'REVOKED' || consentStatus === 'PENDING'}
                    >
                      Reject Application
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}
