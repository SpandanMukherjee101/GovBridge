"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ArrowLeft, CheckCircle2, Clock, XCircle, ShieldCheck, Building2, Landmark, Network, Activity, ChevronDown, ChevronUp, Shield, Building } from "lucide-react";
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
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [consentStatus, setConsentStatus] = useState<string>("ACTIVE");
  const [pendingConsent, setPendingConsent] = useState<any>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
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
          if (consents.some((c: any) => c.status === 'REVOKED' || c.status === 'REJECTED')) {
            hasRevokedConsent = true;
            setConsentStatus("REVOKED");
          } else {
            const pending = consents.find((c: any) => c.status === 'PENDING');
            if (pending) {
              setConsentStatus("PENDING");
              setPendingConsent(pending);
            }
          }
        } catch (e) {
          // Ignore consent fetch errors
        }

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
      }
      try {
        const drData = await apiFetch(`/interoperability/data-requests?applicationId=${resolvedParams.id}`);
        setDataRequests(Array.isArray(drData) ? drData : drData.data || []);
      } catch (e) {
        // Ignore data requests fetch errors
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading secure application data...</div>;
  }

  if (!application) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Application Not Found</h2>
        <Link href="/applications">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

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
      // Refresh
      const data = await apiFetch(`/applications/applications/${resolvedParams.id}`);
      setApplication(data.application || data);
      
      try {
        const timelineData = await apiFetch(`/applications/applications/${resolvedParams.id}/timeline`);
        const timelineItems = Array.isArray(timelineData) ? timelineData : timelineData.data || [];
        setTimeline(timelineItems);
      } catch (e) {
        // Ignore
      }
      try {
        const drData = await apiFetch(`/interoperability/data-requests?applicationId=${resolvedParams.id}`);
        setDataRequests(Array.isArray(drData) ? drData : drData.data || []);
      } catch (e) {
        // Ignore
      }
    } catch (err: any) {
      alert(`Failed to ${action} application: ${err.message}`);
    }
  };

  const isApproved = application.status === 'APPROVED';
  const isRejected = application.status === 'REJECTED';
  const isPropertyVerified = dataRequests.some(dr => dr.target_system === 'PROPERTY_REGISTRY' && dr.status === 'COMPLETED');
  const isTaxVerified = dataRequests.some(dr => dr.target_system === 'TAX_SYSTEM' && dr.status === 'COMPLETED');
  const isGovVerificationDone = isPropertyVerified && isTaxVerified && consentStatus !== 'PENDING';
  const isIdentityVerified = true; // Implicit
  const isReviewComplete = isApproved || isRejected;

  // Interoperability visualization statuses
  const propStatus = isPropertyVerified ? "Verified" : (consentStatus === 'REVOKED' ? "Failed" : "Pending");
  const taxStatus = isTaxVerified ? "Verified" : (consentStatus === 'REVOKED' ? "Failed" : "Pending");
  const identityStatus = "Verified";

  if (user?.role === 'OFFICER' || user?.role === 'ADMIN') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">
                Review Application
              </h1>
              <p className="text-gray-500 font-mono mt-1">Application #APP-{application.id}</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Application Summary */}
            <ScrollReveal delay={0.1}>
              <Card className="shadow-md border-t-4 border-t-gov-blue">
                <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
                  <CardTitle className="text-lg text-gray-800">Application Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Type</p>
                    <p className="text-lg font-semibold text-gray-900">{application.service_name?.replace(/_/g, ' ') || application.service_type?.replace(/_/g, ' ') || 'Business Licence'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</p>
                    <p className="text-base text-gray-800">{application.data?.applicant_name || `Citizen #${application.applicant_id}`}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Status</p>
                    <span className={`inline-flex mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                      isApproved ? 'bg-emerald-100 text-emerald-700' :
                      isRejected ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {application.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Verification Summary */}
            <ScrollReveal delay={0.2}>
              <Card className="shadow-md">
                <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
                  <CardTitle className="text-lg text-gray-800">Verification Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-gray-100">
                    <div className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gov-blue" />
                        <span className="font-medium text-gray-700">Identity</span>
                      </div>
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Verified</span>
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium text-gray-700">Property Ownership</span>
                      </div>
                      {isPropertyVerified ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Verified</span>
                      ) : (
                        <span className="text-amber-500 font-bold flex items-center gap-1"><Clock className="w-4 h-4"/> Pending</span>
                      )}
                    </div>
                    <div className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Landmark className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-gray-700">Tax Clearance</span>
                      </div>
                      {isTaxVerified ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Verified</span>
                      ) : (
                        <span className="text-amber-500 font-bold flex items-center gap-1"><Clock className="w-4 h-4"/> Pending</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Connected Systems */}
            <ScrollReveal delay={0.3}>
              <Card className="shadow-md">
                <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
                  <CardTitle className="text-lg text-gray-800">Connected Systems</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-gray-100">
                    <div className="py-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Property Registry</span>
                        {isPropertyVerified ? <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Data received</span> : <span className="text-xs text-gray-400">Waiting...</span>}
                      </div>
                    </div>
                    <div className="py-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Tax System</span>
                        {isTaxVerified ? <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Data received</span> : <span className="text-xs text-gray-400">Waiting...</span>}
                      </div>
                    </div>
                    <div className="py-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Licensing Department</span>
                        <span className="text-xs text-gov-blue font-medium flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gov-blue"></div> Current review</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          <div className="space-y-8">
            {/* Interoperability Activity */}
            <ScrollReveal delay={0.4}>
              <Card className="shadow-md h-full">
                <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
                  <CardTitle className="text-lg text-gray-800">Interoperability Activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-gray-200">
                    {timeline.map((item: any, idx: number) => {
                      let title = "Event";
                      let desc = "";
                      let Icon = CheckCircle2;
                      let color = "bg-slate-500";
                      
                      if (item.status === 'SUBMITTED') { title = "Application submitted"; desc = "Citizen initiated request"; color = "bg-blue-500"; }
                      else if (item.status === 'CONSENT_GRANTED') { title = "Consent granted"; desc = "Citizen authorized data access"; color = "bg-emerald-500"; }
                      else if (item.status === 'UNDER_REVIEW') { title = "Verification processing"; desc = "Data requested from connected systems"; color = "bg-indigo-500"; }
                      else if (item.status === 'APPROVED') { title = "Application approved"; desc = "Officer decision recorded"; color = "bg-emerald-600"; }
                      else if (item.status === 'REJECTED') { title = "Application rejected"; desc = item.notes; color = "bg-red-500"; Icon = XCircle; }
                      else { title = item.status.replace(/_/g, ' '); color = "bg-gray-400"; }
                      
                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`${color} text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                            <p className="text-xs text-gray-500">{new Date(item.timestamp || item.created_at).toLocaleString()}</p>
                            {desc && <p className="text-xs text-gray-600 mt-1">{desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                    {dataRequests.map((dr, idx) => (
                      <div key={`dr-${idx}`} className="relative flex items-start gap-4">
                        <div className={`bg-emerald-500 text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{dr.target_system.replace(/_/g, ' ')} verified</h4>
                          <p className="text-xs text-gray-500">{new Date(dr.updated_at).toLocaleString()}</p>
                          <p className="text-xs text-gray-600 mt-1">Data normalized and verified</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>

        {/* Officer Decision */}
        {(!isApproved && !isRejected) && (
          <ScrollReveal delay={0.5}>
            <Card className={`shadow-lg border-2 ${isGovVerificationDone ? 'border-emerald-300 bg-emerald-50/30' : 'border-amber-300 bg-amber-50/30'}`}>
              <CardContent className="p-8 text-center">
                {isGovVerificationDone ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification complete</h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">All required government information has been received and normalized via GovBridge.</p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                      {!rejecting ? (
                        <>
                          <Button 
                            onClick={() => handleAction('approve')} 
                            className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 text-lg py-6 shadow-md"
                          >
                            Approve Application
                          </Button>
                          <Button 
                            onClick={() => setRejecting(true)} 
                            variant="outline" 
                            className="w-full sm:w-1/2 border-red-200 text-red-600 hover:bg-red-50 text-lg py-6 shadow-sm"
                          >
                            Reject Application
                          </Button>
                        </>
                      ) : (
                        <div className="w-full text-left space-y-3">
                          <label className="text-sm font-bold text-red-900">Please provide a rejection reason (required):</label>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-3 bg-white text-gray-900 border border-red-300 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={3}
                            placeholder="State the regulatory reason for rejection..."
                            autoFocus
                          />
                          <div className="flex gap-3">
                            <Button onClick={() => handleAction('reject')} variant="destructive" className="flex-1 py-5" disabled={!rejectReason.trim()}>Confirm Rejection</Button>
                            <Button onClick={() => { setRejecting(false); setRejectReason(""); }} variant="outline" className="flex-1 bg-white py-5">Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Verification</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">Cannot proceed with decision until citizen consent is granted and interoperability data is received.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">
              {application.service_name?.replace(/_/g, ' ') || application.service_type?.replace(/_/g, ' ') || 'Application'}
            </h1>
            <p className="text-gray-500 font-mono mt-1">Application #APP-{application.id}</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Current Status Card */}
      <ScrollReveal delay={0.1}>
        <Card className={`border-2 shadow-md ${isApproved ? 'border-emerald-200 bg-emerald-50' : isRejected ? 'border-red-200 bg-red-50' : 'border-gov-blue/20 bg-blue-50/50'}`}>
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Current Status</p>
              <h2 className={`text-2xl font-bold ${isApproved ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-gov-blue'}`}>
                {application.status?.replace(/_/g, ' ') || 'PENDING'}
              </h2>
            </div>
            
            {consentStatus === 'REVOKED' && !isReviewComplete && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2 mt-4">
                <XCircle className="w-5 h-5" /> ⊘ Access revoked. Cannot proceed with background data exchange.
              </div>
            )}
            
            {consentStatus === 'PENDING' && pendingConsent && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-4 w-full">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 mt-1">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900">Action Required: Data Access Request</h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      {pendingConsent.requesting_department || 'Municipal Licensing Department'} requires access to your government records to process this application.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Button 
                        onClick={async () => {
                          try {
                            await apiFetch(`/interoperability/consents/${pendingConsent.id}/grant`, { method: "POST" });
                            setConsentStatus("ACTIVE");
                            setPendingConsent(null);
                            // Also refresh data requests to kickstart the progress
                            const drData = await apiFetch(`/interoperability/data-requests?applicationId=${resolvedParams.id}`);
                            setDataRequests(Array.isArray(drData) ? drData : drData.data || []);
                          } catch (err) {
                            alert("Failed to grant consent");
                          }
                        }}
                        className="bg-gov-blue hover:bg-blue-700 text-white shadow-sm"
                      >
                        Grant Access
                      </Button>
                      <Link href="/consents">
                        <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                          Review Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {consentStatus === 'ACTIVE' && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm border border-emerald-200 flex items-center gap-2 mt-4 w-full md:w-auto">
                <ShieldCheck className="w-5 h-5" /> ✓ Authorization granted
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Journey and Govt Verification */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Application Journey */}
          <ScrollReveal delay={0.2}>
            <Card className="shadow-md">
              <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50">
                <CardTitle className="text-lg">Application Journey</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-gray-200">
                  
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="bg-emerald-500 text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Application Submitted</h4>
                      <p className="text-sm text-gray-500">{new Date(application.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <div className="bg-emerald-500 text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Identity Recognized</h4>
                      <p className="text-sm text-gray-500">Applicant verified via Identity Service</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`${isGovVerificationDone ? 'bg-emerald-500' : 'bg-gov-blue animate-pulse'} text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white`}>
                      {isGovVerificationDone ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isGovVerificationDone ? 'text-gray-900' : 'text-gov-blue'}`}>Government Verification</h4>
                      <p className="text-sm text-gray-500">Cross-checking external system records</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`${isReviewComplete ? 'bg-emerald-500' : isGovVerificationDone ? 'bg-gov-blue animate-pulse' : 'bg-gray-300'} text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white`}>
                      {isReviewComplete ? <CheckCircle2 className="w-4 h-4" /> : isGovVerificationDone ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div> : <div className="w-4 h-4"></div>}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isReviewComplete ? 'text-gray-900' : isGovVerificationDone ? 'text-gov-blue' : 'text-gray-400'}`}>Department Review</h4>
                      <p className="text-sm text-gray-500">Manual review by Municipal Licensing officer</p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-gray-300'} text-white rounded-full p-1 z-10 shrink-0 mt-0.5 shadow ring-4 ring-white`}>
                      {isApproved ? <CheckCircle2 className="w-4 h-4" /> : isRejected ? <XCircle className="w-4 h-4" /> : <div className="w-4 h-4"></div>}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isApproved ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-gray-400'}`}>Final Decision</h4>
                      {isRejected && <p className="text-sm text-red-600 mt-1 font-medium">Rejected: {timeline.find(t => t.status === 'REJECTED')?.notes?.replace('Rejected: ', '') || "No reason provided"}</p>}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Interoperability Visualization */}
          <ScrollReveal delay={0.3}>
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="bg-blue-900 text-white pb-6">
                <CardTitle className="text-lg flex items-center gap-2"><Network className="w-5 h-5" /> Interoperability Network</CardTitle>
                <CardDescription className="text-blue-200">How GovBridge connects your data securely</CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-slate-50">
                
                <div className="flex flex-col items-center">
                  {/* External Systems */}
                  <div className="flex justify-between w-full max-w-sm mb-6">
                    <div className="flex flex-col items-center">
                      <div className={`w-24 p-3 rounded-lg text-center shadow-sm border ${propStatus === 'Verified' ? 'bg-white border-emerald-200' : 'bg-gray-100 border-gray-200'}`}>
                        <Building2 className={`w-6 h-6 mx-auto mb-1 ${propStatus === 'Verified' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold uppercase text-gray-500">Property</span>
                      </div>
                      <div className="h-8 border-l-2 border-dashed border-gov-blue mt-2"></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-24 p-3 rounded-lg text-center shadow-sm border ${taxStatus === 'Verified' ? 'bg-white border-emerald-200' : 'bg-gray-100 border-gray-200'}`}>
                        <Landmark className={`w-6 h-6 mx-auto mb-1 ${taxStatus === 'Verified' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold uppercase text-gray-500">Tax</span>
                      </div>
                      <div className="h-8 border-l-2 border-dashed border-gov-blue mt-2"></div>
                    </div>
                  </div>

                  {/* GovBridge Core */}
                  <div className="w-full max-w-md bg-white border-2 border-gov-blue p-4 rounded-xl shadow-md z-10 flex items-center justify-between relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gov-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">GovBridge Engine</div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-gov-blue" />
                      <span className="text-sm font-medium text-gov-blue">Verify & Normalize</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150"></div>
                    </div>
                  </div>

                  {/* Down to App */}
                  <div className="h-8 border-l-2 border-solid border-gov-blue mb-2 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-gov-blue rotate-45"></div>
                  </div>

                  {/* Application */}
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm text-center w-full max-w-sm mt-2">
                    <span className="text-sm font-semibold text-gray-700">Application Record</span>
                    <p className="text-xs text-gray-500 mt-1">Data securely attached to APP-{application.id}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        {/* Right Column: Verification Status & Admin Actions */}
        <div className="space-y-8">
          
          <ScrollReveal delay={0.4}>
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                <CardTitle className="text-lg">Verification Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  
                  {/* Entity Linking */}
                  <div className="p-4 bg-blue-50/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="w-4 h-4 text-gov-blue" />
                      <span className="font-semibold text-sm text-gov-blue">GovBridge Entity Linked</span>
                    </div>
                    <div className="bg-white border border-blue-100 p-3 rounded-md shadow-sm">
                      <div className="text-xs font-mono text-gray-500 mb-2">ENT-{application.user_id?.toString().padStart(4, '0') || '1001'}</div>
                      <div className="text-xs text-gray-600">
                        Unified identity matched across government records:
                        <div className="flex gap-2 mt-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-medium">Identity <CheckCircle2 className="w-3 h-3 text-emerald-500"/></span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-medium">Property <CheckCircle2 className="w-3 h-3 text-emerald-500"/></span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-medium">Tax <CheckCircle2 className="w-3 h-3 text-emerald-500"/></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Registry Pipeline */}
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-sm text-gov-blue">Property Registry</span>
                      </div>
                      {propStatus === 'Verified' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">✓ VERIFIED</span>
                      ) : propStatus === 'Failed' ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">FAILED</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase flex items-center gap-1"><Clock className="w-3 h-3 animate-pulse"/> CHECKING...</span>
                      )}
                    </div>
                    
                    {propStatus === 'Verified' && (
                      <div className="mt-2 space-y-2 border-l-2 border-emerald-100 ml-2 pl-3">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">REQUEST: </span>
                          <span className="text-gray-600">Municipal Licensing requested property ownership info.</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">AUTHORIZATION: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Citizen consent verified</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">IDENTITY MATCH: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Matched applicant to government record</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">CONNECTOR: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Property Registry connector</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">RESPONSE: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Government record received</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">NORMALIZATION: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Converted to GovBridge common format</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">RESULT: </span>
                          <span className="text-emerald-600 font-medium inline-flex items-center gap-1">✓ Property ownership verified</span>
                        </div>
                        
                        <details className="mt-2 group">
                          <summary className="text-xs font-medium text-gov-blue cursor-pointer list-none flex items-center gap-1">
                            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                            Data transformation visual
                          </summary>
                          <div className="mt-2 bg-slate-50 p-3 rounded-md border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1 break-all">
                            <div><span className="text-slate-400"># Government System Format</span></div>
                            <div>{`{"tax_id":"123","owner_nm":"John Doe","addr":"123 Main St"}`}</div>
                            <div className="flex justify-center text-slate-300">↓</div>
                            <div><span className="text-slate-400"># GovBridge Standardization</span></div>
                            <div className="flex justify-center text-slate-300">↓</div>
                            <div><span className="text-emerald-600 font-bold">Standardized Record</span></div>
                            <div>{`{ "verified": true, "ownerName": "John Doe" }`}</div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Tax System Pipeline */}
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-sm text-gov-blue">Tax System</span>
                      </div>
                      {taxStatus === 'Verified' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">✓ VERIFIED</span>
                      ) : taxStatus === 'Failed' ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">FAILED</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase flex items-center gap-1"><Clock className="w-3 h-3 animate-pulse"/> CHECKING...</span>
                      )}
                    </div>
                    
                    {taxStatus === 'Verified' && (
                      <div className="mt-2 space-y-2 border-l-2 border-emerald-100 ml-2 pl-3">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">REQUEST: </span>
                          <span className="text-gray-600">Municipal Licensing requested tax clearance info.</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">AUTHORIZATION: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Citizen consent verified</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">IDENTITY MATCH: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Matched applicant to government record</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">CONNECTOR: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Tax System connector</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">RESPONSE: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Government record received</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">NORMALIZATION: </span>
                          <span className="text-gray-600 inline-flex items-center gap-1">✓ Converted to GovBridge common format</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">RESULT: </span>
                          <span className="text-emerald-600 font-medium inline-flex items-center gap-1">✓ Tax clearance verified</span>
                        </div>
                        
                        <details className="mt-2 group">
                          <summary className="text-xs font-medium text-gov-blue cursor-pointer list-none flex items-center gap-1">
                            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                            Data transformation visual
                          </summary>
                          <div className="mt-2 bg-slate-50 p-3 rounded-md border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1 break-all">
                            <div><span className="text-slate-400"># Government System Format</span></div>
                            <div>{`{"id":"5932","clearance_status":"CLEARED","out_bal":0.00}`}</div>
                            <div className="flex justify-center text-slate-300">↓</div>
                            <div><span className="text-slate-400"># GovBridge Standardization</span></div>
                            <div className="flex justify-center text-slate-300">↓</div>
                            <div><span className="text-emerald-600 font-bold">Standardized Record</span></div>
                            <div>{`{ "verified": true, "outstandingBalance": 0 }`}</div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* How It Works Accordion */}
          <ScrollReveal delay={0.5}>
            <Card className="shadow-md">
              <button 
                className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors focus:outline-none rounded-lg"
                onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gov-blue" />
                  <span className="font-semibold text-gray-900">How GovBridge works</span>
                </div>
                {isHowItWorksOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              
              {isHowItWorksOpen && (
                <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                  <ol className="mt-4 space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:h-full before:w-0.5 before:bg-gray-200">
                    <li className="relative flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-bold z-10 shrink-0 mt-0.5">1</div>
                      <p className="text-sm text-gray-700 leading-tight pt-1">Required government information is identified.</p>
                    </li>
                    <li className="relative flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-bold z-10 shrink-0 mt-0.5">2</div>
                      <p className="text-sm text-gray-700 leading-tight pt-1">Citizen authorization is checked.</p>
                    </li>
                    <li className="relative flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-bold z-10 shrink-0 mt-0.5">3</div>
                      <p className="text-sm text-gray-700 leading-tight pt-1">Connected systems are queried securely.</p>
                    </li>
                    <li className="relative flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-bold z-10 shrink-0 mt-0.5">4</div>
                      <p className="text-sm text-gray-700 leading-tight pt-1">Data is normalized and verified.</p>
                    </li>
                    <li className="relative flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-bold z-10 shrink-0 mt-0.5">5</div>
                      <p className="text-sm text-gray-700 leading-tight pt-1">Result is attached to the application.</p>
                    </li>
                  </ol>
                </div>
              )}
            </Card>
          </ScrollReveal>

          {/* Officer Actions */}
          {(user?.role === "OFFICER" || user?.role === "ADMIN") && application.status === "SUBMITTED" && (
            <ScrollReveal delay={0.6}>
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3 border-b border-amber-100">
                  <CardTitle className="text-amber-900 text-lg">Department Review</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {(consentStatus === 'REVOKED' || consentStatus === 'PENDING') && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md text-xs border border-red-200 mb-4">
                      Cannot approve. Consent is {consentStatus === 'REVOKED' ? 'revoked' : 'pending'}.
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
                    <div className="space-y-2 mt-4">
                      <label className="text-sm font-medium text-red-900">Rejection Reason:</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2 bg-white text-gray-900 border border-red-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleAction('reject')} variant="destructive" className="flex-1">Confirm</Button>
                        <Button onClick={() => { setRejecting(false); setRejectReason(""); }} variant="outline" className="flex-1 bg-white">Cancel</Button>
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
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

        </div>
      </div>
    </div>
  );
}
