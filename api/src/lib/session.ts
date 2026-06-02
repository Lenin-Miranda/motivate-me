import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "motivate_me_session";
export const SESSION_TTL_DAYS = 30;

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function hashSessionToken(sessionToken: string): string {
  return createHash("sha256").update(sessionToken).digest("hex");
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function getCookieValue(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const matchingCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!matchingCookie) {
    return null;
  }

  return decodeURIComponent(matchingCookie.slice(name.length + 1));
}

export function getSessionTokenFromRequest(req: Request): string | null {
  return getCookieValue(req, SESSION_COOKIE_NAME);
}

export function setSessionCookie(res: Response, sessionToken: string) {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getAuthenticatedUser(req: Request) {
  const sessionToken = getSessionTokenFromRequest(req);

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(sessionToken),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user;
}
