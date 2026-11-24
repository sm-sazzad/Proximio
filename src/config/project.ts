/**
 * Project and Developer Configuration
 * Central source of truth for developer profile, portfolio links, team credits, and project details.
 */

export interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  github?: string;
  isLead?: boolean;
}

export interface ProjectItem {
  title: string;
  description: string;
  tech: string[];
  liveUrl: string;
  githubUrl: string;
  serverGithubUrl?: string;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface DeveloperProfile {
  name: string;
  role: string;
  institution: string;
  program: string;
  location: string;
  bio: string;
  avatar: string;
  portfolioUrl: string;
  cvUrl?: string;
  github?: string;
  linkedin?: string;
  email?: string;
  skills: SkillGroup[];
  projects: ProjectItem[];
}

export interface ProjectConfig {
  projectName: string;
  tagline: string;
  description: string;
  courseName: string;
  institution: string;
  instructor?: string;
  semester?: string;
  year?: string;
  repositoryUrl?: string;
  liveSiteUrl?: string;
  team: TeamMember[];
  developer: DeveloperProfile;
}

export const projectConfig: ProjectConfig = {
  projectName: "Proximo",
  tagline: "Proximity, in real time.",
  description:
    "An ESP32 and an ultrasonic sensor measure distance, and this dashboard shows and controls it live from any device.",
  courseName: "Microcontroller-Based Systems Design And Development",
  institution: "Kushtia Polytechnic Institute",
  instructor: "Tanvir Ahammed",
  semester: "Diploma in Engineering (CST)",
  year: "2026",
  repositoryUrl: "https://github.com/sm-sazzad",
  liveSiteUrl: "https://proximo-zeta.vercel.app/",
  team: [
    {
      name: "Sheikh Md Sazzad Hossain",
      role: "Team Leader & Full-Stack / IoT Developer",
      isLead: true,
    },
    {
      name: "Adnan Karim Riad",
      role: "Hardware Assembly & Circuit Testing",
    },
    {
      name: "AL Imran Jony",
      role: "Embedded Systems & Sensor Calibration",
    },
    {
      name: "Antora Sarkar",
      role: "Technical Documentation & Analysis",
    },
    {
      name: "Hamim Kefayet",
      role: "Hardware Prototyping & Power Testing",
    },
    {
      name: "Riad",
      role: "Component Integration & Quality Check",
    },
    {
      name: "Samira Islam",
      role: "UI/UX Research & Presentation",
    },
    {
      name: "Sanzidur Rahman Santo",
      role: "IoT Telemetry & Network Testing",
    },
    {
      name: "Shakibul Islam",
      role: "Firmware Verification & System Testing",
    },
  ],
  developer: {
    name: "Sheikh Md Sazzad Hossain",
    role: "Web Developer",
    institution: "Kushtia Polytechnic Institute",
    program: "Diploma in Engineering, Computer Science and Technology (CST)",
    location: "Kushtia, Bangladesh",
    bio: "I'm a Computer Science and Technology student and web developer from Kushtia, Bangladesh. I build clean, responsive, user-friendly web experiences with modern web technologies. I created Proximo for my Microcontroller-Based Systems course, connecting an ESP32 distance-sensing system to a live, real-time Next.js dashboard.",
    avatar: "/developer.png",
    portfolioUrl: "https://sazzad-dev.vercel.app/",
    cvUrl: "/resume.pdf",
    github: "https://github.com/sm-sazzad",
    linkedin: "https://linkedin.com/in/sm-sazzad/",
    email: "sazzadhossain5758@gmail.com",
    skills: [
      {
        category: "Frontend",
        skills: ["HTML5", "CSS3", "Tailwind CSS", "React", "Next.js"],
      },
      {
        category: "Languages",
        skills: ["JavaScript", "TypeScript"],
      },
      {
        category: "Backend",
        skills: ["Node.js", "Express.js", "MongoDB", "Better Auth"],
      },
      {
        category: "Embedded & IoT",
        skills: ["ESP32", "Arduino C++", "Firebase Realtime Database"],
      },
      {
        category: "Tools",
        skills: ["Git", "GitHub"],
      },
    ],
    projects: [
      {
        title: "PizzaHub",
        description:
          "Multi-vendor food ordering platform connecting customers with artisanal pizzerias, supporting order tracking, kitchen management, and platform governance. Features role-based access control (Customer, Vendor, Admin), duplicate-order prevention, real-time status updates, Stripe Checkout subscription upgrades, and an administrative dashboard.",
        tech: [
          "Next.js",
          "React.js",
          "TypeScript",
          "Tailwind CSS",
          "Node.js",
          "Express.js",
          "MongoDB",
          "Better Auth",
          "Stripe",
        ],
        liveUrl: "https://pizzahub-delta.vercel.app",
        githubUrl:
          "https://github.com/sm-sazzad/PizzaHub-Pizza-Ordering-Delivery-Platform",
        serverGithubUrl: "https://github.com/sm-sazzad/pizzahub-server.git",
      },
      {
        title: "Kindred",
        description:
          "Community volunteering platform connecting volunteers with events across blood donation, environmental protection, food distribution, education, and healthcare. Features email/password and Google authentication with Better Auth, event management with category filtering, and join/leave flows with a personal dashboard.",
        tech: [
          "Next.js",
          "React.js",
          "TypeScript",
          "Tailwind CSS",
          "Node.js",
          "Express.js",
          "MongoDB",
          "Better Auth",
        ],
        liveUrl: "https://kindred-client.vercel.app",
        githubUrl: "https://github.com/sm-sazzad/KindRed.git",
        serverGithubUrl: "https://github.com/sm-sazzad/KindRed-Server.git",
      },
      {
        title: "CineList",
        description:
          "A movie discovery platform built with Next.js and the TMDB API: search movies, view details and save favorites or a watchlist.",
        tech: ["React", "Next.js", "Tailwind CSS"],
        liveUrl: "https://cine-list-sm-sazzad.vercel.app/",
        githubUrl: "https://github.com/sm-sazzad/CineList",
      },
    ],
  },
};
