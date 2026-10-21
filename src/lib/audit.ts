import { db } from "./db";

type AuditInput = {
  action: string;
  resource: string;
  resourceId?: string;
  ipHash?: string;
  actorId?: string;
};

let testRecorder: ((input: AuditInput) => Promise<void>) | undefined;

export function __setAuditRecorderForTests(recorder: (input: AuditInput) => Promise<void>): void {
  testRecorder = recorder;
}

export function __resetAuditRecorderForTests(): void {
  testRecorder = undefined;
}

export async function recordAuditEvent(input: AuditInput): Promise<void> {
  if (testRecorder) return testRecorder(input);
  await db.auditEvent.create({ data: input });
}
