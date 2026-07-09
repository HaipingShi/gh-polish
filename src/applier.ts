import { assertRealGitHubMutationAllowed } from "./mutationGuard.js";
import type { OperationRisk } from "./policy.js";

export type ApplyOperation =
  | { id: string; kind: "file"; path: string; content: string; risk: OperationRisk; requiresConfirmation: boolean }
  | { id: string; kind: "metadata"; description?: string; homepage?: string; risk: OperationRisk; requiresConfirmation: boolean }
  | { id: string; kind: "topics"; topics: string[]; risk: OperationRisk; requiresConfirmation: boolean };

export interface ApplyRequest {
  planId: string;
  branchName: string;
  baseBranch: string;
  operations: ApplyOperation[];
  confirmations: string[];
  dryRun: boolean;
}

export interface ApplyEvidence {
  planId: string;
  dryRun: boolean;
  branchName: string;
  operations: string[];
  pullRequestUrl?: string;
  mutation: "none" | "executed";
}

export interface GitApplyClient {
  createBranch(branchName: string, baseBranch: string): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  commit(message: string): Promise<void>;
  push(branchName: string): Promise<void>;
}

export interface PullRequestClient {
  openPullRequest(input: { branchName: string; baseBranch: string; title: string; body: string }): Promise<{ url: string }>;
}

export interface MetadataMutationClient {
  updateRepositoryMetadata(input: { description?: string; homepage?: string }): Promise<void>;
  replaceTopics(topics: string[]): Promise<void>;
}

export interface ApplyClients {
  git: GitApplyClient;
  pullRequest: PullRequestClient;
  metadata?: MetadataMutationClient;
}

export async function applyApprovedPlan(
  request: ApplyRequest,
  clients: ApplyClients,
  env: NodeJS.ProcessEnv = process.env
): Promise<ApplyEvidence> {
  validateApplyRequest(request, env);

  if (request.dryRun) {
    return {
      planId: request.planId,
      dryRun: true,
      branchName: request.branchName,
      operations: request.operations.map((operation) => operation.id),
      mutation: "none"
    };
  }

  await clients.git.createBranch(request.branchName, request.baseBranch);
  for (const operation of request.operations) {
    if (operation.kind === "file") await clients.git.writeFile(operation.path, operation.content);
    if (operation.kind === "metadata") await clients.metadata?.updateRepositoryMetadata(operation);
    if (operation.kind === "topics") await clients.metadata?.replaceTopics(operation.topics);
  }
  await clients.git.commit(`chore: apply gh-polish plan ${request.planId}`);
  await clients.git.push(request.branchName);
  const pr = await clients.pullRequest.openPullRequest({
    branchName: request.branchName,
    baseBranch: request.baseBranch,
    title: `Apply gh-polish plan ${request.planId}`,
    body: `Applies approved gh-polish plan ${request.planId}.`
  });

  return {
    planId: request.planId,
    dryRun: false,
    branchName: request.branchName,
    operations: request.operations.map((operation) => operation.id),
    pullRequestUrl: pr.url,
    mutation: "executed"
  };
}

function validateApplyRequest(request: ApplyRequest, env: NodeJS.ProcessEnv): void {
  if (request.branchName === request.baseBranch) {
    throw new Error("Apply refuses to mutate the default branch directly.");
  }

  for (const operation of request.operations) {
    if (operation.risk === "refused") throw new Error(`Operation ${operation.id} is refused by policy.`);
    if (operation.requiresConfirmation && !request.confirmations.includes(operation.id)) {
      throw new Error(`Operation ${operation.id} requires explicit confirmation.`);
    }
  }

  if (!request.dryRun) {
    const guard = assertRealGitHubMutationAllowed(env);
    if (!guard.allowed) throw new Error(guard.reason);
  }
}
