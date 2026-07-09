import type { ProjectStack } from "./localAnalyzer.js";

export type TemplateId = "readme" | "gitignore" | "contributing" | "security" | "pr-template" | "dependabot" | "ci";

export interface TemplateDefinition {
  id: TemplateId;
  targetPath: string;
  stacks: ProjectStack[];
  render(input: TemplateInput): string;
}

export interface TemplateInput {
  projectName: string;
  stack: ProjectStack;
  commands?: {
    test?: string;
    lint?: string;
    build?: string;
  };
}

export interface TemplateSelection {
  template: TemplateDefinition;
  action: "create" | "manual_review";
  reason: string;
}

export function selectTemplate(id: TemplateId, stacks: ProjectStack[], existingPaths: Set<string>): TemplateSelection {
  const stack = stacks.find((candidate) => registry.some((template) => template.id === id && template.stacks.includes(candidate))) ?? "generic";
  const template = registry.find((candidate) => candidate.id === id && candidate.stacks.includes(stack));
  if (!template) throw new Error(`No template registered for ${id}.`);
  if (existingPaths.has(template.targetPath)) {
    return { template, action: "manual_review", reason: "Existing file must not be overwritten automatically." };
  }
  return { template, action: "create", reason: "Missing file can be created through a PR." };
}

export const registry: TemplateDefinition[] = [
  {
    id: "readme",
    targetPath: "README.md",
    stacks: ["node", "python", "go", "rust", "generic"],
    render: ({ projectName }) => `# ${projectName}\n\nProject overview.\n`
  },
  {
    id: "gitignore",
    targetPath: ".gitignore",
    stacks: ["node", "python", "go", "rust", "generic"],
    render: ({ stack }) => stack === "node" ? "node_modules/\ndist/\n.env\n" : ".env\n.DS_Store\n"
  },
  {
    id: "contributing",
    targetPath: "CONTRIBUTING.md",
    stacks: ["node", "python", "go", "rust", "generic"],
    render: () => "# Contributing\n\nPlease open an issue or pull request with clear context.\n"
  },
  {
    id: "security",
    targetPath: "SECURITY.md",
    stacks: ["node", "python", "go", "rust", "generic"],
    render: () => "# Security\n\nPlease report vulnerabilities privately to the maintainer.\n"
  },
  {
    id: "pr-template",
    targetPath: ".github/pull_request_template.md",
    stacks: ["node", "python", "go", "rust", "generic"],
    render: () => "## Summary\n\n## Verification\n\n"
  },
  {
    id: "dependabot",
    targetPath: ".github/dependabot.yml",
    stacks: ["node", "python", "go", "rust", "generic"],
    render: ({ stack }) => `version: 2\nupdates:\n  - package-ecosystem: "${stack === "node" ? "npm" : "github-actions"}"\n    directory: "/"\n    schedule:\n      interval: "weekly"\n`
  },
  {
    id: "ci",
    targetPath: ".github/workflows/ci.yml",
    stacks: ["node"],
    render: ({ commands }) => `name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm ci\n      - run: ${commands?.test ?? "npm test"}\n`
  },
  {
    id: "ci",
    targetPath: ".github/workflows/ci.yml",
    stacks: ["python", "go", "rust", "generic"],
    render: ({ commands }) => `name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: ${commands?.test ?? "echo \"No test command detected\""}\n`
  }
];
