export type OperationRisk = "read" | "low" | "medium" | "high" | "refused";
export type OperationSurface = "file" | "metadata" | "topics" | "branch_ruleset" | "required_checks" | "security" | "pages" | "actions_policy" | "release" | "default_branch";

export interface OperationPolicyInput {
  surface: OperationSurface;
  mutation: boolean;
}

export interface OperationPolicyDecision {
  risk: OperationRisk;
  requiresConfirmation: boolean;
  allowedInMvp: boolean;
  reason: string;
}

export function classifyOperation(input: OperationPolicyInput): OperationPolicyDecision {
  if (!input.mutation) {
    return { risk: "read", requiresConfirmation: false, allowedInMvp: true, reason: "Read-only operation." };
  }

  if (input.surface === "file") {
    return { risk: "low", requiresConfirmation: false, allowedInMvp: true, reason: "File change must be applied through a branch and PR." };
  }

  if (input.surface === "metadata" || input.surface === "topics") {
    return { risk: "medium", requiresConfirmation: true, allowedInMvp: true, reason: "Repository metadata changes require explicit confirmation." };
  }

  if (input.surface === "default_branch") {
    return { risk: "refused", requiresConfirmation: true, allowedInMvp: false, reason: "Direct default-branch mutation is refused in MVP." };
  }

  return { risk: "high", requiresConfirmation: true, allowedInMvp: false, reason: "High-risk GitHub setting is recommendation-only in MVP." };
}
