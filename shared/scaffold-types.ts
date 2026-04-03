export type AppCategory =
  | "saas"
  | "dashboard"
  | "ecommerce"
  | "social"
  | "blog"
  | "portfolio"
  | "tool"
  | "game";

export interface ScaffoldFile {
  path: string;      // e.g. "app/page.tsx"
  content: string;
  language: string;  // "typescript" | "sql" | "json" | "markdown" | "env"
}

export interface ScaffoldProject {
  appName: string;
  appDescription: string;
  appCategory: AppCategory;
  techStack: string[];
  files: ScaffoldFile[];
  sqlSchema: string;
  envExample: string;
  readmeContent: string;
  packageJson: string;
  aiModel?: string;
}

export interface ProjectSummary {
  id: number;
  appName: string;
  appDescription: string;
  appCategory: string;
  techStack: string[];
  createdAt: Date;
  userId?: number | null;
}
