import { createHash } from "node:crypto";
import { loadPlanArtifact, type PlanArtifact } from "./planArtifact.js";
import {
  executeSavedRepositoryReadyWorkflow,
  prepareRepositoryReadyWorkflow,
  type ExecuteSavedRepositoryReadyWorkflowInput,
  type PrepareRepositoryReadyWorkflowInput
} from "./repositoryReadyWorkflow.js";
import type { LocalEffectExecutor } from "./localApply.js";
import type {
  PullRequestAdapter,
  RepositoryReadyExecutionEvidence,
  RevisionCheckAdapter
} from "./repositoryReadyExecution.js";

const AGENT_PROTOCOL_VERSION = "1" as const;

export interface ReviewAgentRepositoryReadyInput {
  artifactReference: string;
  planStore: string;
  confirmations: readonly string[];
}

export interface ExecuteAgentRepositoryReadyInput extends ExecuteSavedRepositoryReadyWorkflowInput {
  reviewToken: string;
}

export async function prepareAgentRepositoryReady(input: PrepareRepositoryReadyWorkflowInput) {
  const prepared = await prepareRepositoryReadyWorkflow(input);
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    command: "repository-ready.prepare" as const,
    phase: "awaiting-review" as const,
    effects: {
      inspectedRepository: "none" as const,
      planStore: "write" as const,
      liveGitHub: "none" as const
    },
    plan: {
      id: prepared.artifactId,
      reference: prepared.artifactPath,
      profile: prepared.preview.profile,
      items: prepared.preview.items,
      confirmations: prepared.confirmations
    },
    next: {
      command: "repository-ready.review" as const,
      action: "Show the preview and request confirmation for the exact create-effect IDs."
    }
  };
}

export async function reviewAgentRepositoryReady(input: ReviewAgentRepositoryReadyInput) {
  const artifact = await loadPlanArtifact(input.artifactReference, input.planStore);
  const confirmations = validateExactConfirmations(artifact, input.confirmations);
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    command: "repository-ready.review" as const,
    phase: "ready-to-execute" as const,
    effects: {
      inspectedRepository: "none" as const,
      planStore: "none" as const,
      liveGitHub: "none" as const
    },
    review: {
      token: createReviewToken(artifact, confirmations),
      artifactDigest: artifact.digest,
      confirmations,
      impacts: artifact.effects.map((effect) => ({
        operationId: effect.operationId,
        path: effect.path,
        action: "create" as const
      }))
    },
    next: {
      command: "repository-ready.execute" as const,
      action: "Execute only with this review token and the same exact confirmations."
    }
  };
}

export async function executeAgentRepositoryReady(
  input: ExecuteAgentRepositoryReadyInput,
  executor: LocalEffectExecutor,
  pullRequests: PullRequestAdapter,
  revisionChecks: RevisionCheckAdapter
) {
  const artifact = await loadPlanArtifact(input.artifactReference, input.planStore);
  const confirmations = validateExactConfirmations(artifact, input.confirmations);
  if (input.reviewToken !== createReviewToken(artifact, confirmations)) {
    throw new Error("Review token does not match the saved artifact and exact confirmations.");
  }
  const execution = await executeSavedRepositoryReadyWorkflow({
    artifactReference: input.artifactReference,
    planStore: input.planStore,
    branchName: input.branchName,
    confirmations,
    pullRequest: input.pullRequest,
    previousEvidence: input.previousEvidence,
    now: input.now
  }, executor, pullRequests, revisionChecks);
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    command: "repository-ready.execute" as const,
    phase: execution.status === "completed" ? "completed" as const : "needs-attention" as const,
    effects: {
      inspectedRepository: "non-default-branch" as const,
      remote: "local-bare-remote" as const,
      liveGitHub: "none" as const,
      automaticMerge: "none" as const
    },
    execution,
    m1: createM1CompletionReport(execution),
    next: {
      action: execution.recovery.action,
      command: execution.recovery.command
    }
  };
}

export function createM1CompletionReport(execution: RepositoryReadyExecutionEvidence) {
  const achieved = execution.status === "completed"
    && execution.pullRequest.status !== "failed"
    && execution.pullRequest.status !== "not-attempted"
    && execution.checks.status === "success"
    && execution.mergeDecision.status === "ready-for-review";
  return {
    stage: "M1 Repository Ready" as const,
    overall: achieved ? "deferred" as const : "not-ready" as const,
    credentialFree: achieved ? "achieved" as const : "not-ready" as const,
    liveGitHub: "deferred" as const,
    reason: achieved
      ? "Credential-free M1 evidence is achieved; live GitHub remains deferred until a separately authorized adapter produces real repository evidence."
      : "Credential-free M1 evidence is incomplete; live GitHub also remains deferred.",
    evidence: {
      planId: execution.planId,
      branch: execution.branchName,
      headSha: execution.pullRequest.headSha,
      pullRequestId: execution.pullRequest.id,
      checks: execution.checks.status,
      mergeDecision: execution.mergeDecision.status
    }
  };
}

function validateExactConfirmations(artifact: PlanArtifact, values: readonly string[]): string[] {
  const expected = artifact.effects.map((effect) => effect.operationId).sort();
  const received = [...values].sort();
  if (new Set(received).size !== received.length) throw new Error("Confirmation list contains duplicate effect IDs.");
  for (const value of received) {
    if (!expected.includes(value)) throw new Error(`Confirmation '${value}' is not part of the plan.`);
  }
  for (const value of expected) {
    if (!received.includes(value)) throw new Error(`Missing confirmation for effect '${value}'.`);
  }
  if (expected.length === 0) throw new Error("Saved plan contains no executable effects to review.");
  return received;
}

function createReviewToken(artifact: PlanArtifact, confirmations: readonly string[]): string {
  return createHash("sha256").update(JSON.stringify({
    artifactDigest: artifact.digest,
    confirmations: [...confirmations].sort()
  })).digest("hex");
}
