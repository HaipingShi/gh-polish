import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export type ProjectStack = "node" | "python" | "go" | "rust" | "generic";

export interface LocalFileFindings {
  readme: boolean;
  license: boolean;
  gitignore: boolean;
  contributing: boolean;
  security: boolean;
  codeOfConduct: boolean;
  issueTemplates: boolean;
  pullRequestTemplate: boolean;
  workflows: string[];
  dependabot: boolean;
  codeql: boolean;
}

export interface CommandFindings {
  test?: string;
  lint?: string;
  build?: string;
}

export interface LocalAnalysis {
  root: string;
  stacks: ProjectStack[];
  manifests: string[];
  files: LocalFileFindings;
  commands: CommandFindings;
}

export async function analyzeLocalRepository(root: string): Promise<LocalAnalysis> {
  const manifests = await detectManifests(root);
  const stacks = detectStacks(manifests);
  const workflows = await listWorkflowFiles(root);
  const packageJson = manifests.includes("package.json") ? await readPackageJson(root) : undefined;

  return {
    root,
    stacks,
    manifests,
    files: {
      readme: await existsAny(root, ["README.md", "README"]),
      license: await existsAny(root, ["LICENSE", "LICENSE.md", "COPYING"]),
      gitignore: await exists(root, ".gitignore"),
      contributing: await existsAny(root, ["CONTRIBUTING.md", ".github/CONTRIBUTING.md"]),
      security: await existsAny(root, ["SECURITY.md", ".github/SECURITY.md"]),
      codeOfConduct: await existsAny(root, ["CODE_OF_CONDUCT.md", ".github/CODE_OF_CONDUCT.md"]),
      issueTemplates: await exists(root, ".github/ISSUE_TEMPLATE"),
      pullRequestTemplate: await existsAny(root, [".github/pull_request_template.md", "PULL_REQUEST_TEMPLATE.md"]),
      workflows,
      dependabot: await exists(root, ".github/dependabot.yml") || await exists(root, ".github/dependabot.yaml"),
      codeql: workflows.some((workflow) => workflow.toLowerCase().includes("codeql"))
    },
    commands: detectCommands(stacks, packageJson)
  };
}

function detectStacks(manifests: string[]): ProjectStack[] {
  const stacks = new Set<ProjectStack>();
  if (manifests.includes("package.json")) stacks.add("node");
  if (manifests.some((name) => ["pyproject.toml", "requirements.txt", "setup.py"].includes(name))) stacks.add("python");
  if (manifests.includes("go.mod")) stacks.add("go");
  if (manifests.includes("Cargo.toml")) stacks.add("rust");
  if (stacks.size === 0) stacks.add("generic");
  return [...stacks].sort();
}

async function detectManifests(root: string): Promise<string[]> {
  const candidates = ["package.json", "pyproject.toml", "requirements.txt", "setup.py", "go.mod", "Cargo.toml"];
  const found: string[] = [];
  for (const candidate of candidates) {
    if (await exists(root, candidate)) {
      found.push(candidate);
    }
  }
  return found.sort();
}

async function listWorkflowFiles(root: string): Promise<string[]> {
  const dir = join(root, ".github", "workflows");
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.(ya?ml)$/i.test(entry.name))
      .map((entry) => `.github/workflows/${entry.name}`)
      .sort();
  } catch {
    return [];
  }
}

async function existsAny(root: string, paths: readonly string[]): Promise<boolean> {
  for (const path of paths) {
    if (await exists(root, path)) return true;
  }
  return false;
}

async function exists(root: string, path: string): Promise<boolean> {
  try {
    await stat(join(root, path));
    return true;
  } catch {
    return false;
  }
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(join(root, "package.json"), "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function detectCommands(stacks: ProjectStack[], packageJson?: Record<string, unknown>): CommandFindings {
  if (stacks.includes("node") && packageJson) {
    const scripts = typeof packageJson.scripts === "object" && packageJson.scripts !== null ? packageJson.scripts as Record<string, unknown> : {};
    return {
      test: typeof scripts.test === "string" ? "npm test" : undefined,
      lint: typeof scripts.lint === "string" ? "npm run lint" : undefined,
      build: typeof scripts.build === "string" ? "npm run build" : undefined
    };
  }

  if (stacks.includes("python")) return { test: "pytest" };
  if (stacks.includes("go")) return { test: "go test ./...", build: "go build ./..." };
  if (stacks.includes("rust")) return { test: "cargo test", build: "cargo build" };
  return {};
}
