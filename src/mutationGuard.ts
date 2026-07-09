export interface MutationGuardResult {
  allowed: boolean;
  reason: string;
}

export function assertRealGitHubMutationAllowed(env: NodeJS.ProcessEnv): MutationGuardResult {
  if (env.GH_POLISH_ALLOW_REAL_GITHUB_MUTATION === "1") {
    return {
      allowed: true,
      reason: "Real GitHub mutation is explicitly enabled."
    };
  }

  return {
    allowed: false,
    reason: "Real GitHub mutation is disabled unless GH_POLISH_ALLOW_REAL_GITHUB_MUTATION=1 is set."
  };
}
