"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  Building2,
  ShieldCheck,
  Network,
  FileText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  GitMerge,
  Layers,
  Eye,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <header className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gov-blue rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gov-blue-dark tracking-tight">GovBridge</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#how-it-works" className="hidden sm:block text-sm text-gray-600 hover:text-gov-blue transition-colors font-medium">How it works</a>
          <Link href="/login">
            <Button variant="outline" className="border-gov-blue text-gov-blue hover:bg-gov-blue hover:text-white transition-all">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative bg-gov-blue-dark text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, #D4AF37 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1A5276 0%, transparent 50%)"
            }}
          />
          <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
            <ScrollReveal duration={0.7} direction="up">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-8 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Smart India Hackathon — Live Demo
              </div>
            </ScrollReveal>

            <ScrollReveal duration={0.8} delay={0.1} direction="up">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
                YOUR GOVERNMENT<br />
                <span className="text-gov-gold">SERVICES.</span><br />
                ONE JOURNEY.
              </h1>
            </ScrollReveal>

            <ScrollReveal duration={0.8} delay={0.25} direction="up">
              <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
                GovBridge connects independently operated government systems so citizens can submit applications once and follow a unified journey — with full control over their data.
              </p>
            </ScrollReveal>

            <ScrollReveal duration={0.8} delay={0.4} direction="up">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="text-base px-8 py-6 rounded-full bg-gov-gold text-gov-blue-dark font-bold hover:bg-yellow-400 shadow-xl transition-all hover:scale-105">
                    TRY THE DEMO
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-full border-white/40 text-white hover:bg-white/10 transition-all">
                    SEE HOW IT WORKS
                    <ChevronDown className="ml-2 w-5 h-5" />
                  </Button>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <div className="text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-widest text-gov-blue bg-blue-50 px-3 py-1 rounded-full">The Problem We Solve</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4">Government services are fragmented. We connect them.</h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Before */}
              <ScrollReveal delay={0.1} direction="up">
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold text-lg">BEFORE GOVBRIDGE</span>
                  </div>
                  <div className="p-6 space-y-0">
                    {[
                      { label: "Citizen", sub: "Needs a Business Licence" },
                      { label: "Portal A", sub: "Municipal Licensing Department" },
                      { label: "Portal B", sub: "Property Registry — separate login" },
                      { label: "Portal C", sub: "Tax System — different forms" },
                      { label: "Manual submission", sub: "Repeated information, physical documents" },
                      { label: "Multiple tracking portals", sub: "No single status view" },
                    ].map((step, i, arr) => (
                      <div key={i}>
                        <div className="flex items-start gap-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                            <p className="text-xs text-gray-500">{step.sub}</p>
                          </div>
                        </div>
                        {i < arr.length - 1 && <div className="w-0.5 h-3 bg-red-100 ml-3.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* After */}
              <ScrollReveal delay={0.2} direction="up">
                <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                  <div className="bg-emerald-600 text-white px-6 py-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-lg">AFTER GOVBRIDGE</span>
                  </div>
                  <div className="p-6 space-y-0">
                    {[
                      { label: "Citizen", sub: "Submits one application" },
                      { label: "GovBridge", sub: "Single unified platform" },
                      { label: "Consent", sub: "Citizen authorises data access" },
                      { label: "Connected Systems", sub: "Property Registry + Tax System queried automatically" },
                      { label: "Verification", sub: "Data normalized and cross-verified" },
                      { label: "One Application Journey", sub: "Unified status, one decision" },
                    ].map((step, i, arr) => (
                      <div key={i}>
                        <div className="flex items-start gap-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                            <p className="text-xs text-gray-500">{step.sub}</p>
                          </div>
                        </div>
                        {i < arr.length - 1 && <div className="w-0.5 h-3 bg-emerald-100 ml-3.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="bg-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <div className="text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-widest text-gov-blue bg-blue-50 px-3 py-1 rounded-full">The Platform</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4">How GovBridge works</h2>
                <p className="text-gray-500 mt-3 max-w-xl mx-auto">A non-technical explanation of the complete interoperability flow.</p>
              </div>
            </ScrollReveal>

            <div className="relative">
              {/* Vertical connector */}
              <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-gov-blue via-emerald-400 to-gov-gold hidden md:block" />

              <div className="space-y-6">
                {[
                  { icon: Users, color: "bg-gov-blue", label: "Citizen", desc: "Submits a Business Licence application through GovBridge in minutes, not days." },
                  { icon: FileText, color: "bg-indigo-600", label: "Application", desc: "The application is registered and a unified tracking journey begins immediately." },
                  { icon: ShieldCheck, color: "bg-amber-500", label: "Consent", desc: "GovBridge asks the citizen to authorise access to specific government records. The citizen is always in control." },
                  { icon: Network, color: "bg-sky-600", label: "Interoperability Layer", desc: "With consent granted, GovBridge's engine routes requests to the Property Registry and Tax System via configured connectors." },
                  { icon: Building2, color: "bg-teal-600", label: "Government Data Systems", desc: "Property Registry confirms ownership. Tax System confirms clearance. Responses arrive in their native formats." },
                  { icon: Layers, color: "bg-violet-600", label: "Normalisation & Verification", desc: "GovBridge converts disparate response formats into a common structure and marks each data point as verified." },
                  { icon: Eye, color: "bg-orange-500", label: "Department Review", desc: "The Licensing Officer sees the application with all verifications pre-attached. They review and decide." },
                  { icon: CheckCircle2, color: "bg-emerald-600", label: "Decision", desc: "The citizen receives a single outcome notification. One journey, one result." },
                ].map((step, i) => (
                  <ScrollReveal key={i} delay={i * 0.07} direction="up">
                    <div className="flex items-start gap-5 relative">
                      <div className={`${step.color} w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md z-10`}>
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                        <p className="font-bold text-gray-900">{step.label}</p>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── LIVE PRODUCT EXAMPLE ── */}
        <section className="bg-gov-blue-dark text-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-gov-gold bg-gov-gold/10 px-3 py-1 rounded-full border border-gov-gold/30">Live Example</span>
                <h2 className="text-3xl md:text-4xl font-extrabold mt-4">Business Licence Application</h2>
                <p className="text-white/60 mt-3 max-w-xl mx-auto">This is a real application journey running on GovBridge.</p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Application Steps */}
              <ScrollReveal delay={0.1} direction="up">
                <div className="bg-white/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                  <h3 className="font-bold text-gov-gold uppercase text-xs tracking-widest mb-5">Application Journey</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Application submitted", done: true },
                      { label: "Identity verified via Identity Service", done: true },
                      { label: "Property ownership verified", done: true },
                      { label: "Tax clearance verified", done: true },
                      { label: "Department review (Officer decision)", done: false, active: true },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-500" : step.active ? "bg-amber-400 animate-pulse" : "bg-white/20"}`}>
                          {step.done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-2 h-2 rounded-full bg-white/60" />}
                        </div>
                        <span className={`text-sm ${step.done ? "text-white" : step.active ? "text-amber-300 font-medium" : "text-white/40"}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Connected Systems */}
              <ScrollReveal delay={0.2} direction="up">
                <div className="bg-white/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                  <h3 className="font-bold text-gov-gold uppercase text-xs tracking-widest mb-5">Connected Government Systems</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Property Registry", status: "Verified", detail: "Ownership confirmed" },
                      { name: "Tax System", status: "Verified", detail: "Clearance confirmed" },
                      { name: "Municipal Licensing", status: "Reviewing", detail: "Officer in progress" },
                    ].map((sys, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        <div>
                          <p className="font-semibold text-white text-sm">{sys.name}</p>
                          <p className="text-xs text-white/50 mt-0.5">{sys.detail}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${sys.status === "Verified" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                          {sys.status === "Verified" ? "✓ " : "● "}{sys.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Link href="/login">
                      <button className="w-full bg-gov-gold text-gov-blue-dark font-bold text-sm py-3 rounded-xl hover:bg-yellow-400 transition-all">
                        Try This In The Demo →
                      </button>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── WHY GOVBRIDGE ── */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <div className="text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-widest text-gov-blue bg-blue-50 px-3 py-1 rounded-full">Capabilities</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4">Why GovBridge</h2>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  color: "text-gov-blue bg-blue-50",
                  title: "CONSENT-DRIVEN",
                  desc: "Citizens authorise eligible cross-department data access. No data moves without explicit permission.",
                },
                {
                  icon: GitMerge,
                  color: "text-violet-600 bg-violet-50",
                  title: "INTEROPERABLE",
                  desc: "Connected systems can remain independently operated. GovBridge is the integration layer, not the replacement.",
                },
                {
                  icon: Layers,
                  color: "text-teal-600 bg-teal-50",
                  title: "STANDARDIZED",
                  desc: "Different government responses are normalised into a common representation before reaching the officer.",
                },
                {
                  icon: Eye,
                  color: "text-amber-600 bg-amber-50",
                  title: "TRACEABLE",
                  desc: "Application and data-exchange actions are recorded in an immutable audit trail accessible to administrators.",
                },
              ].map((card, i) => (
                <ScrollReveal key={i} delay={i * 0.1} direction="up">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{card.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{card.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="bg-gov-blue py-16 px-6 text-center">
          <ScrollReveal direction="up">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to see it in action?</h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">Log in as a citizen, submit a Business Licence application, and follow the complete interoperability journey in real time.</p>
            <Link href="/login">
              <Button size="lg" className="text-base px-10 py-6 rounded-full bg-white text-gov-blue font-bold hover:bg-gray-100 shadow-xl transition-all hover:scale-105">
                TRY THE DEMO
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <footer className="py-8 bg-gov-blue-dark text-white/50 text-center text-sm">
        <p>© 2026 GovBridge Platform — Smart India Hackathon</p>
        <p className="mt-1 text-xs text-white/30">This is a demonstration system. All data is synthetic.</p>
      </footer>
    </div>
  );
}
