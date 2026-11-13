/**
 * Project and Developer Configuration
 * Central source of truth for developer profile, portfolio links, team credits, and project details.
 */

export interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  github?: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  tech: string[];
  liveUrl: string;
  githubUrl: string;
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
  semester?: string;
  year?: string;
  repositoryUrl?: string;
  team: TeamMember[];
  developer: DeveloperProfile;
}

export const projectConfig: ProjectConfig = {
  projectName: "Proximo",
  tagline: "Proximity, in real time.",
  description:
    "An ESP32 and an ultrasonic sensor measure distance, and this dashboard shows and controls it live from any device.",
  courseName: "Microcontroller-Based Systems",
  institution: "Kushtia Polytechnic Institute",
  semester: "Diploma in Engineering (CST)",
  year: "2026",
  repositoryUrl: "https://github.com/sm-sazzad",
  team: [
    {
      name: "Sheikh Md Sazzad Hossain",
      role: "Lead Developer & Embedded Systems",
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
    cvUrl: "https://sazzad-dev.vercel.app/files/cv.pdf",
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
        title: "BazarDor",
        description:
          "A Bengali-language web app for exploring essential commodity prices, browsing product categories and comparing daily market price changes in Bangladesh.",
        tech: ["Next.js", "TypeScript", "Tailwind CSS", "Better Auth"],
        liveUrl: "https://bazar-dor-sm-sazzad.vercel.app/",
        githubUrl: "https://github.com/sm-sazzad/BazarDor",
      },
      {
        title: "Vistora",
        description:
          "A modern editorial blog platform that fetches articles from The Guardian Open Platform API, with category browsing, pagination and article detail pages.",
        tech: ["Next.js", "TypeScript", "Tailwind CSS"],
        liveUrl: "https://vistora-sm-sazzad.vercel.app/",
        githubUrl: "https://github.com/sm-sazzad/Vistora-mini-blog",
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
