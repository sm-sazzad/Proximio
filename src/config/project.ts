/**
 * Project and Team Configuration
 * Edit this file to update project credits, course details, and team members.
 */

export interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  github?: string;
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
}

export const projectConfig: ProjectConfig = {
  projectName: "Proximo",
  tagline: "Proximity, in real time.",
  description:
    "An ESP32 and an ultrasonic sensor measure distance, and this dashboard shows and controls it live from any device.",
  // EDIT HERE: Course Name
  courseName: "IoT & Embedded Systems (Course Name)",
  // EDIT HERE: Institution Name
  institution: "Department of Computer Science & Engineering (Institution)",
  semester: "Fall Semester",
  year: "2026",
  repositoryUrl: "https://github.com",
  // EDIT HERE: Team Members (Add, remove or update names and roles)
  team: [
    {
      name: "Your Name",
      role: "Hardware & Firmware Lead",
    },
    {
      name: "Team Member 2",
      role: "Frontend & Cloud Integration",
    },
    {
      name: "Team Member 3",
      role: "Kinematics & UI Testing",
    },
  ],
};
