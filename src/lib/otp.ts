import { randomInt } from "node:crypto";
import { compare, hash } from "bcryptjs";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

type UserRecord = { id: string; email: string; isActive: boolean };
type ChallengeRecord = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  consumedAt: Date | null;
  createdAt?: Date;
  requestedFromHash?: string | null;
  testCode?: string;
};

type OtpStore = {
  challenges: ChallengeRecord[];
  users: UserRecord[];
  createChallenge?: (challenge: ChallengeRecord) => Promise<void>;
  findLatestChallenge?: (email: string) => Promise<ChallengeRecord | null>;
  updateChallenge?: (challenge: ChallengeRecord) => Promise<void>;
  invalidateChallenges?: (email: string) => Promise<void>;
  replaceChallenge?: (email: string, challenge: ChallengeRecord) => Promise<void>;
  consumeChallenge?: (challenge: ChallengeRecord) => Promise<boolean>;
  findUser?: (email: string) => Promise<UserRecord | null>;
};

let testStore: OtpStore | undefined;

export function __setOtpStoreForTests(store: OtpStore): void {
  testStore = store;
  store.createChallenge ??= async (challenge) => { store.challenges.push(challenge); };
  store.findLatestChallenge ??= async (email) => store.challenges
    .filter((challenge) => challenge.email === email && challenge.consumedAt === null)
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0] ?? null;
  store.updateChallenge ??= async (challenge) => {
    const index = store.challenges.findIndex((candidate) => candidate.id === challenge.id);
    store.challenges[index] = challenge;
  };
  store.invalidateChallenges ??= async (email) => {
    for (const challenge of store.challenges) {
      if (challenge.email === email && challenge.consumedAt === null) challenge.consumedAt = new Date();
    }
  };
  store.findUser ??= async (email) => store.users.find((user) => user.email === email) ?? null;
}

export function __resetOtpStoreForTests(): void {
  testStore = undefined;
}

async function productionStore(): Promise<OtpStore> {
  const { db } = await import("./db");
  const prisma = db as any;
  return {
    challenges: [],
    users: [],
    createChallenge: async (challenge) => { await prisma.loginChallenge.create({ data: challenge }); },
    invalidateChallenges: async (email) => {
      await prisma.loginChallenge.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: new Date() } });
    },
    replaceChallenge: async (email, challenge) => prisma.$transaction(async (tx: any) => {
      await tx.loginChallenge.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: new Date() } });
      await tx.loginChallenge.create({ data: challenge });
    }),
    findLatestChallenge: async (email) => prisma.loginChallenge.findFirst({
      where: { email, consumedAt: null }, orderBy: { createdAt: "desc" },
    }),
    updateChallenge: async (challenge) => { await prisma.loginChallenge.update({ where: { id: challenge.id }, data: { attempts: challenge.attempts, consumedAt: challenge.consumedAt } }); },
    consumeChallenge: async (challenge) => (await prisma.loginChallenge.updateMany({ where: { id: challenge.id, consumedAt: null }, data: { consumedAt: challenge.consumedAt } })).count === 1,
    findUser: async (email) => prisma.user.findUnique({ where: { email }, select: { id: true, email: true, isActive: true } }),
  };
}

async function getStore(): Promise<OtpStore> {
  return testStore ?? productionStore();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}

function invalidOtp(): Error {
  return new Error("Invalid or expired OTP");
}

export async function requestOtp(email: string, requestFingerprint?: string): Promise<{ accepted: true }> {
  const normalizedEmail = normalizeEmail(email);
  const store = await getStore();
  const code = String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
  const challenge: ChallengeRecord = {
    id: `challenge-${Date.now()}-${randomInt(0, 1_000_000)}`,
    email: normalizedEmail,
    codeHash: await hash(code, 12),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    consumedAt: null,
    createdAt: new Date(),
    requestedFromHash: requestFingerprint,
  };
  if (testStore) challenge.testCode = code;
  if (store.replaceChallenge) await store.replaceChallenge(normalizedEmail, challenge);
  else {
    await store.invalidateChallenges!(normalizedEmail);
    await store.createChallenge!(challenge);
  }
  return { accepted: true };
}

export async function verifyOtp(email: string, code: string): Promise<{ userId: string; isNewUser: boolean }> {
  if (!isValidOtp(code)) throw invalidOtp();
  const normalizedEmail = normalizeEmail(email);
  const store = await getStore();
  const challenge = await store.findLatestChallenge!(normalizedEmail);
  if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now() || challenge.attempts >= challenge.maxAttempts) throw invalidOtp();

  if (!(await compare(code, challenge.codeHash))) {
    challenge.attempts = Math.min(challenge.attempts + 1, challenge.maxAttempts);
    await store.updateChallenge!(challenge);
    throw invalidOtp();
  }

  const user = await store.findUser!(normalizedEmail);
  if (!user || !user.isActive) throw invalidOtp();
  challenge.consumedAt = new Date();
  if (store.consumeChallenge) {
    if (!await store.consumeChallenge(challenge)) throw invalidOtp();
  } else await store.updateChallenge!(challenge);
  return { userId: user.id, isNewUser: false };
}
