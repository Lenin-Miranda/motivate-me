import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import getStringField from "../helpers";
import { prisma } from "../lib/prisma";
import {
  clearSessionCookie,
  getAuthenticatedUser,
  getSessionExpiry,
  getSessionTokenFromRequest,
  hashSessionToken,
  setSessionCookie,
} from "../lib/session";
import { logger } from "../middleware/logger";

const PASSWORD_MIN_LENGTH = 12;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type ScryptOptions = typeof SCRYPT_OPTIONS;

async function deriveScryptKey(
  password: string,
  salt: string,
  options: ScryptOptions,
): Promise<Buffer> {
  const pepper = process.env.AUTH_PEPPER ?? "";

  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password + pepper,
      salt,
      SCRYPT_KEY_LENGTH,
      options,
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      },
    );
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await deriveScryptKey(password, salt, SCRYPT_OPTIONS);

  return [
    "scrypt",
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

async function verifyPassword(
  password: string,
  storedPasswordHash: string,
): Promise<boolean> {
  const [algorithm, n, r, p, salt, expectedHash] = storedPasswordHash.split("$");

  if (!algorithm || !n || !r || !p || !salt || !expectedHash) {
    return false;
  }

  if (algorithm !== "scrypt") {
    return false;
  }

  const parsedOptions = {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  };

  if (
    Number.isNaN(parsedOptions.N) ||
    Number.isNaN(parsedOptions.r) ||
    Number.isNaN(parsedOptions.p)
  ) {
    return false;
  }

  const derivedKey = await deriveScryptKey(password, salt, parsedOptions);
  const expectedKey = Buffer.from(expectedHash, "hex");

  if (expectedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expectedKey, derivedKey);
}

async function createSessionForUser(req: Request, userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(sessionToken);
  const refreshFamily = randomBytes(16).toString("hex");
  const expiresAt = getSessionExpiry();
  const ipAddress = getStringField(req.ip);
  const userAgent = getStringField(req.get("user-agent"));

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      refreshFamily,
      expiresAt,
      ipAddress,
      userAgent,
      lastUsedAt: new Date(),
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  return {
    session,
    sessionToken,
  };
}

async function claimAnonymousQuestionnaire(
  questionnaireSubmissionId: string | null,
  userId: string,
) {
  if (!questionnaireSubmissionId) {
    return;
  }

  const updatedQuestionnaire = await prisma.questionnaireSubmission.updateMany({
    where: {
      id: questionnaireSubmissionId,
      userId: null,
    },
    data: { userId },
  });

  if (updatedQuestionnaire.count === 0) {
    return;
  }

  await prisma.motivationalPhrase.updateMany({
    where: {
      questionnaireSubmissionId,
      userId: null,
    },
    data: { userId },
  });
}

function canLogin(status: string): boolean {
  return status === "ACTIVE" || status === "PENDING";
}

export async function registerUser(req: Request, res: Response) {
  try {
    const email = getStringField(req.body.email)?.toLowerCase();
    const password = getStringField(req.body.password);
    const questionnaireSubmissionId = getStringField(
      req.body.questionnaireSubmissionId,
    );

    if (!email || !password) {
      logger.error({
        status: 400,
        message: "Email and password are required",
      });

      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email format is invalid" });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      logger.error({
        status: 409,
        message: "A user with that email already exists",
      });

      return res
        .status(409)
        .json({ message: "A user with that email already exists" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await claimAnonymousQuestionnaire(questionnaireSubmissionId, user.id);
    const { session, sessionToken } = await createSessionForUser(req, user.id);
    setSessionCookie(res, sessionToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    logger.info({
      status: 201,
      message: "User registered and logged in successfully",
    });

    return res.status(201).json({
      message: "User registered successfully",
      session,
      user,
    });
  } catch (error) {
    logger.error({
      status: 500,
      message: `Failed to register user: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const email = getStringField(req.body.email)?.toLowerCase();
    const password = getStringField(req.body.password);

    if (!email || !password) {
      logger.error({
        status: 400,
        message: "Email and password are required",
      });

      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      logger.error({
        status: 401,
        message: "Invalid credentials",
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.error({
        status: 401,
        message: "Invalid credentials",
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!canLogin(user.status)) {
      logger.error({
        status: 403,
        message: "This account is not allowed to sign in",
      });

      return res.status(403).json({
        message: "This account is not allowed to sign in",
      });
    }

    const { session, sessionToken } = await createSessionForUser(req, user.id);
    setSessionCookie(res, sessionToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    logger.info({
      status: 200,
      message: "User logged in successfully",
    });

    return res.status(200).json({
      message: "User logged in successfully",
      session,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error({
      status: 500,
      message: `Failed to log in user: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    logger.error({
      status: 500,
      message: `Failed to get current user: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    const sessionToken = getSessionTokenFromRequest(req);

    if (sessionToken) {
      await prisma.session.updateMany({
        where: {
          tokenHash: hashSessionToken(sessionToken),
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    clearSessionCookie(res);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error({
      status: 500,
      message: `Failed to log out user: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    return res.status(500).json({ message: "Internal server error" });
  }
}
