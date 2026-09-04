"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ArrowLeft, CheckCircle2, Clock, XCircle, ShieldCheck, Building2, Landmark, Network, Activity, ChevronDown, ChevronUp } from "lucide-react";
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
          } else if (consents.some((c: any) => c.status === 'PENDING')) {
            setConsentStatus("PENDING");
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
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Data access consent revoked. Cannot proceed.
              </div>
            )}
            
            {consentStatus === 'PENDING' && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200 flex items-center gap-2">
                <Clock className="w-5 h-5 animate-pulse" /> Awaiting citizen consent for data access.
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
                <CardTitle className="text-lg">System Verification</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  <div className="p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gov-blue" />
                        <span className="font-semibold text-sm text-gov-blue">Identity Service</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">VERIFIED</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-6">Connection: Connected</span>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-sm text-gov-blue">Property Registry</span>
                      </div>
                      {propStatus === 'Verified' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">{propStatus}</span>
                      ) : propStatus === 'Failed' ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">{propStatus}</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase">{propStatus}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 ml-6">Purpose: Property ownership</span>
                  </div>

                  <div className="p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-sm text-gov-blue">Tax System</span>
                      </div>
                      {taxStatus === 'Verified' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">{taxStatus}</span>
                      ) : taxStatus === 'Failed' ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase">{taxStatus}</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase">{taxStatus}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 ml-6">Purpose: Tax clearance</span>
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
