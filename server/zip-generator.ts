import JSZip from "jszip";
import type { ScaffoldFile } from "../shared/scaffold-types";

export interface ZipInput {
  appName: string;
  files: ScaffoldFile[];
  sqlSchema: string;
  envExample: string;
  readmeContent: string;
  packageJson: string;
}

export async function generateProjectZip(input: ZipInput): Promise<Buffer> {
  const zip = new JSZip();
  const folderName = input.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const root = zip.folder(folderName)!;

  // Add all generated source files
  for (const file of input.files) {
    // Skip .env.example from files array — we add it separately below
    if (file.path === ".env.example" || file.path === "README.md") continue;
    root.file(file.path, file.content);
  }

  // Always add these top-level files from dedicated fields
  root.file(".env.example", input.envExample);
  root.file("README.md", input.readmeContent);
  root.file("schema.sql", input.sqlSchema);

  // Parse and re-serialize package.json to ensure it's clean
  try {
    const pkg = JSON.parse(input.packageJson);
    root.file("package.json", JSON.stringify(pkg, null, 2));
  } catch {
    root.file("package.json", input.packageJson);
  }

  // Add .gitignore
  root.file(".gitignore", [
    "# dependencies",
    "node_modules/",
    ".pnp",
    ".pnp.js",
    "",
    "# testing",
    "coverage/",
    "",
    "# next.js",
    ".next/",
    "out/",
    "",
    "# production",
    "build/",
    "dist/",
    "",
    "# env files",
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
    "",
    "# vercel",
    ".vercel",
    "",
    "# typescript",
    "*.tsbuildinfo",
    "next-env.d.ts",
  ].join("\n"));

  // Add postcss.config.js if not already in files
  const hasPostcss = input.files.some(f => f.path.startsWith("postcss.config"));
  if (!hasPostcss) {
    root.file("postcss.config.js", `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`);
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return buffer;
}
