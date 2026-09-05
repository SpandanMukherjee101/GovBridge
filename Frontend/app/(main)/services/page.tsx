"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { FileText, ArrowRight, ShieldCheck, Building2, Landmark, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Services</h1>
          <p className="text-gray-500 text-lg">Discover and apply for services across connected government departments.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Highlighted Service: Business Licence */}
          <Card className="border-2 border-gov-blue/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gov-blue text-white px-4 py-1 text-xs font-bold rounded-bl-lg uppercase tracking-wide">
              Featured Service
            </div>
            <CardHeader className="bg-blue-50/50 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white text-gov-blue rounded-xl shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gov-blue">Business Licence</CardTitle>
                  <CardDescription className="text-sm font-medium text-gray-500 mt-1">
                    Department: Municipal Licensing (DEPT-LICENSING)
                  </CardDescription>
                </div>
              </div>
              <p className="text-gray-600 mt-4 leading-relaxed">
                Apply for or renew your standard municipal business licence. 
                Using the GovBridge network, this application is streamlined by automatically verifying your records across multiple government systems.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">What GovBridge Handles For You</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-blue-50 rounded text-gov-blue"><Activity className="w-4 h-4" /></div>
                  <div>
                    <span className="font-medium text-gray-800">Application Submission</span>
                    <p className="text-sm text-gray-500">Secure digital submission to the licensing department.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-emerald-50 rounded text-emerald-600"><ShieldCheck className="w-4 h-4" /></div>
                  <div>
                    <span className="font-medium text-gray-800">Identity Verification</span>
                    <p className="text-sm text-gray-500">Instant verification via Identity Service.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-indigo-50 rounded text-indigo-600"><Building2 className="w-4 h-4" /></div>
                  <div>
                    <span className="font-medium text-gray-800">Property Verification</span>
                    <p className="text-sm text-gray-500">Cross-checked with the Property Registry.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-amber-50 rounded text-amber-600"><Landmark className="w-4 h-4" /></div>
                  <div>
                    <span className="font-medium text-gray-800">Tax Verification</span>
                    <p className="text-sm text-gray-500">Clearance checked with the Central Tax System.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-purple-50 rounded text-purple-600"><Clock className="w-4 h-4" /></div>
                  <div>
                    <span className="font-medium text-gray-800">Unified Tracking</span>
                    <p className="text-sm text-gray-500">Real-time status updates in one dashboard.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t border-gray-100 pt-6">
              <Link href="/applications/create" className="w-full">
                <Button className="w-full h-12 text-lg font-semibold bg-gov-blue hover:bg-blue-800">
                  Apply Now — Start the Demo <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Placeholder for other services */}
          <div className="space-y-6">
            <Card className="opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all border-dashed">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Building Permit</CardTitle>
                    <CardDescription>Department of Urban Planning</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Currently undergoing integration with the GovBridge platform. Coming soon.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
              </CardFooter>
            </Card>

            <Card className="opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all border-dashed">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tax Rebate Application</CardTitle>
                    <CardDescription>Department of Revenue</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Currently undergoing integration with the GovBridge platform. Coming soon.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </ScrollReveal>

      {/* What happens after you apply */}
      <ScrollReveal delay={0.3}>
        <div className="mt-4 bg-gradient-to-r from-gov-blue-dark to-gov-blue text-white rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">What happens after you apply?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
            {[
              { n: 1, label: "You submit", sub: "One application, minimal information" },
              { n: 2, label: "You consent", sub: "Authorise data access from connected systems" },
              { n: 3, label: "GovBridge verifies", sub: "Property Registry + Tax System queried automatically" },
              { n: 4, label: "Officer reviews", sub: "All verifications pre-attached to the application" },
              { n: 5, label: "You get a decision", sub: "Single notification, one outcome" },
            ].map((step, i, arr) => (
              <div key={i} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-center">
                <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div className="sm:text-center">
                  <p className="font-semibold text-sm">{step.label}</p>
                  <p className="text-xs text-white/60 mt-0.5 leading-snug">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
