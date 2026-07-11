import type { TemplateId } from "./templateRegistry.js";

export const repositoryProfiles = [
  "public-project",
  "private-project",
  "demo",
  "library",
  "application",
  "commercial-product"
] as const;

export type RepositoryProfile = (typeof repositoryProfiles)[number];

const requirements: Record<RepositoryProfile, readonly TemplateId[]> = {
  "public-project": ["readme", "gitignore", "contributing", "pr-template"],
  "private-project": ["readme", "gitignore", "pr-template"],
  demo: ["readme", "gitignore"],
  library: ["readme", "gitignore", "contributing", "pr-template", "ci"],
  application: ["readme", "gitignore", "contributing", "pr-template", "ci"],
  "commercial-product": ["readme", "gitignore", "contributing", "pr-template", "ci"]
};

export function requirementsForProfile(profile: RepositoryProfile): readonly TemplateId[] {
  return requirements[profile];
}
