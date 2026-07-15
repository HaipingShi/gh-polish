export const PROTOCOL_VERSION = "1";

export interface RecoveryStep {
  action: string;
  command?: string;
}

export type ProtocolCommand =
  | "inspect"
  | "plan"
  | "apply"
  | "verify"
  | "ready.prepare"
  | "ready.review"
  | "ready.execute";

export interface JsonEnvelope<T> {
  version: typeof PROTOCOL_VERSION;
  command: ProtocolCommand;
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  warnings: string[];
  recovery: RecoveryStep[];
}

export class ProtocolError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly recovery: RecoveryStep[] = []
  ) {
    super(message);
    this.name = "ProtocolError";
  }
}

export function successEnvelope<T>(command: JsonEnvelope<T>["command"], data: T, warnings: string[] = [], recovery: RecoveryStep[] = []): JsonEnvelope<T> {
  return { version: PROTOCOL_VERSION, command, ok: true, data, warnings, recovery };
}

export function failureEnvelope(command: JsonEnvelope<never>["command"], error: ProtocolError): JsonEnvelope<never> {
  return {
    version: PROTOCOL_VERSION,
    command,
    ok: false,
    error: { code: error.code, message: error.message },
    warnings: [],
    recovery: error.recovery
  };
}

export function serializeEnvelope(envelope: JsonEnvelope<unknown>): string {
  return `${JSON.stringify(envelope, null, 2)}\n`;
}
