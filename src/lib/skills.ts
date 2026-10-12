export type SkillCategory = {
  label: string;
  skills: string[];
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: "Soft Skills",
    skills: [
      "Time management",
      "Adaptability",
      "Conflict resolution",
      "Emotional intelligence",
      "Decision making",
      "Teamwork",
      "Creativity",
      "Attention to detail",
      "Organization",
      "Stress management",
      "Delegation",
      "Empathy",
    ],
  },
  {
    label: "Thinking & Strategy",
    skills: [
      "Critical thinking",
      "Problem-solving",
      "Project management",
      "Strategic planning",
      "Resource management",
      "Risk management",
      "Analytical thinking",
    ],
  },
  {
    label: "Communication",
    skills: [
      "Clear communication",
      "Active listening",
      "Public speaking",
      "Cross-cultural communication",
      "Technical writing",
      "Technical documentation",
    ],
  },
  {
    label: "Engineering",
    skills: [
      "System architecture",
      "Database design",
      "API integration",
      "Performance optimization",
      "Automated testing",
      "Code refactoring",
      "Security auditing",
      "Version control",
      "Cloud deployment",
      "Continuous integration",
      "State management",
      "Asynchronous programming",
      "Cross-browser compatibility",
      "Responsive design",
      "Internationalization",
      "Error handling",
    ],
  },
  {
    label: "Design & Data",
    skills: [
      "UI/UX design",
      "Web accessibility",
      "Data visualization",
      "Data analysis",
      "Research skills",
    ],
  },
  {
    label: "Business",
    skills: [
      "Leadership",
      "Negotiation",
      "Financial literacy",
      "Quality control",
    ],
  },
];

export const ALL_SKILLS = SKILL_CATEGORIES.flatMap((c) => c.skills);

export function parseSkills(raw: string | null | undefined): string[] {
  if (!raw) return [];

  // Try JSON first
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not JSON — fall through
  }

  // Fallback: comma-separated string
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeSkills(skills: string[]): string {
  return JSON.stringify(skills);
}