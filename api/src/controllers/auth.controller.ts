import { randomBytes, scrypt } from "node:crypto";
import type { Request, Response } from "express";
import getStringField from "../helpers";
import { prisma } from "../lib/prisma";
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

async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.AUTH_PEPPER ?? "";
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password + pepper, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });

  return [
    "scrypt",
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

export async function registerUser(req: Request, res: Response) {
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

      return res.status(409).json({ message: "A user with that email already exists" });
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

    logger.info({
      status: 201,
      message: "User registered successfully",
    });

    return res.status(201).json({
      message: "User registered successfully",
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
