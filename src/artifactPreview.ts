import type { LocalAnalysis } from "./localAnalyzer.js";
import { requirementsForProfile, type RepositoryProfile } from "./repositoryProfile.js";
import { selectTemplate, type TemplateId } from "./templateRegistry.js";

export interface ArtifactPreviewItem {
  id: TemplateId;
  path: string;
  action: "create" | "manual_review" | "unknown";
  reason: string;
  content?: string;
}

export interface ArtifactPreview {
  profile: RepositoryProfile;
  projectName: string;
  commands: LocalAnalysis["commands"] & { evidence: "observed" | "unknown" };
  items: ArtifactPreviewItem[];
}

export function createArtifactPreview(
  profile: RepositoryProfile,
  local: LocalAnalysis,
  existingPaths: Set<string>,
  projectName: string
): ArtifactPreview {
  const stack = local.stacks[0] ?? "generic";
  const commandEvidence = Object.values(local.commands).some(Boolean) ? "observed" : "unknown";
  const items = requirementsForProfile(profile).map((id): ArtifactPreviewItem => {
    const selection = selectTemplate(id, local.stacks, existingPaths);
    if (selection.action === "manual_review") {
      return { id, path: selection.template.targetPath, action: "manual_review", reason: selection.reason };
    }
    if (id === "ci" && !local.commands.test) {
      return {
        id,
        path: selection.template.targetPath,
        action: "unknown",
        reason: "No observed test command; CI content cannot be generated truthfully."
      };
    }
    return {
      id,
      path: selection.template.targetPath,
      action: "create",
      reason: selection.reason,
      content: selection.template.render({ projectName, stack, commands: local.commands })
    };
  });

  return {
    profile,
    projectName,
    commands: { ...local.commands, evidence: commandEvidence },
    items
  };
}
