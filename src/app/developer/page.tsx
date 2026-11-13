"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { projectConfig } from "@/config/project";
import {
  ExternalLink,
  Download,
  Mail,
  MapPin,
  GraduationCap,
  Code2,
  FolderGit2,
  Sparkles,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export default function DeveloperPage() {
  const dev = projectConfig.developer;
  const [imageError, setImageError] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      {/* ── 1. Profile Hero Section ──────────────────────────────────────── */}
      <GlassCard hover className="p-6 sm:p-8 relative overflow-hidden">
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10 text-center sm:text-left">
          {/* Avatar with Initials Fallback */}
          <div className="relative shrink-0">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-2 border-accent/40 bg-gradient-to-br from-card via-[#16233B] to-accent/20 shadow-[0_0_25px_rgba(34,211,238,0.2)] flex items-center justify-center">
              {!imageError && dev.avatar ? (
                <Image
                  src={dev.avatar}
                  alt={dev.name}
                  width={128}
                  height={128}
                  priority
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <span className="text-3xl font-extrabold text-accent font-mono tracking-wider">
                  SH
                </span>
              )}
            </div>

            {/* Online Status Dot */}
            <span
              className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-success border-2 border-card shadow-sm"
              title="Available for projects & collaboration"
            />
          </div>

          {/* Profile Details */}
          <div className="space-y-3 min-w-0 flex-1">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                  {dev.name}
                </h1>
                <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/30 font-mono">
                  {dev.role}
                </span>
              </div>

              {/* Education & Location */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted font-mono pt-0.5">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-accent" />
                  {dev.program}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted/60" />
                  {dev.institution}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {dev.location}
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-text/80 leading-relaxed max-w-2xl">
              {dev.bio}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              {/* Primary: Portfolio URL */}
              {dev.portfolioUrl && (
                <a
                  href={dev.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all min-h-[44px]",
                    "bg-accent text-bg hover:bg-accent/90 shadow-[0_0_20px_rgba(34,211,238,0.3)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    "active:scale-95",
                  )}
                  aria-label="Visit my external portfolio website (opens in new tab)"
                >
                  <span>Visit my portfolio</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {/* Secondary: CV */}
              {dev.cvUrl && (
                <a
                  href={dev.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-text hover:bg-white/[0.08] hover:border-accent/40 transition-colors min-h-[44px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  aria-label="Download Curriculum Vitae (PDF)"
                >
                  <Download className="h-3.5 w-3.5 text-accent" />
                  <span>Download CV</span>
                </a>
              )}

              {/* GitHub */}
              {dev.github && (
                <a
                  href={dev.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center h-11 w-11 rounded-lg border border-border/80 bg-white/[0.03] text-muted hover:text-text hover:bg-white/[0.08] hover:border-accent/40 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  title="GitHub Profile"
                  aria-label="View GitHub profile (opens in new tab)"
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
              )}

              {/* LinkedIn */}
              {dev.linkedin && (
                <a
                  href={dev.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center h-11 w-11 rounded-lg border border-border/80 bg-white/[0.03] text-muted hover:text-text hover:bg-white/[0.08] hover:border-accent/40 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  title="LinkedIn Profile"
                  aria-label="View LinkedIn profile (opens in new tab)"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}

              {/* Email */}
              {dev.email && (
                <a
                  href={`mailto:${dev.email}`}
                  className={cn(
                    "inline-flex items-center justify-center h-11 w-11 rounded-lg border border-border/80 bg-white/[0.03] text-muted hover:text-text hover:bg-white/[0.08] hover:border-accent/40 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                  title={`Email ${dev.email}`}
                  aria-label={`Send email to ${dev.email}`}
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 2. Bento Grid: About Project + Skills ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* About This Project Card (5 cols) */}
        <GlassCard hover className="lg:col-span-5 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <SectionHeader
              title="About Proximo"
              icon={<Cpu className="h-4 w-4" />}
              className="mb-1"
            />
            <p className="text-xs text-muted">
              Origin, motivation, and embedded IoT stack.
            </p>
          </div>

          <div className="space-y-3 text-xs text-text/80 leading-relaxed">
            <p>
              Proximo was developed as an end-to-end practical project for the{" "}
              <strong className="text-text">
                {projectConfig.courseName}
              </strong>{" "}
              curriculum at{" "}
              <strong className="text-text">
                {projectConfig.institution}
              </strong>
              .
            </p>
            <p>
              It connects edge ultrasonic hardware (HC-SR04 + ESP32) to Google
              Firebase Realtime Database and a modern Next.js 16 web client with
              sub-second latency, audible alarm sounders, and remote threshold
              tuning.
            </p>
          </div>

          {/* Project Tech Stack Chips */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
              Core Technologies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "ESP32",
                "Arduino C++",
                "Firebase RTDB",
                "Next.js",
                "TypeScript",
                "Tailwind CSS",
                "Framer Motion",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-md border border-border/50 bg-white/[0.02] text-[11px] font-mono text-muted/90"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Grouped Skills Matrix (7 cols) */}
        <GlassCard hover className="lg:col-span-7 p-6 space-y-5">
          <div>
            <SectionHeader
              title="Technical Skills"
              icon={<Code2 className="h-4 w-4" />}
              className="mb-1"
            />
            <p className="text-xs text-muted">
              Core proficiencies across frontend, backend, IoT, and tooling.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {dev.skills.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <span className="text-[11px] font-semibold text-accent font-mono uppercase tracking-wider block">
                  {group.category}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg border border-border/60 bg-white/[0.03] text-xs font-mono text-text/90 hover:border-accent/40 hover:text-accent transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── 3. Selected Work (Three Compact Link Cards) ──────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Selected Work"
            icon={<FolderGit2 className="h-4 w-4" />}
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted border border-border/60 bg-white/[0.02] px-2 py-0.5 rounded-full">
            Featured Projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {dev.projects.map((proj) => (
            <GlassCard
              key={proj.title}
              hover
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-text tracking-tight">
                    {proj.title}
                  </h3>
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </div>
                <p className="text-xs text-muted leading-relaxed line-clamp-3">
                  {proj.description}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                {/* Tech chips */}
                <div className="flex flex-wrap gap-1">
                  {proj.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-white/[0.02] border border-border/40 text-[10px] font-mono text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Links: Live and GitHub */}
                <div className="flex items-center gap-2 pt-1">
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent/15 border border-accent/30 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={`View live demo of ${proj.title}`}
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-text hover:bg-white/[0.08] hover:border-accent/40 transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={`View source code of ${proj.title} on GitHub`}
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
