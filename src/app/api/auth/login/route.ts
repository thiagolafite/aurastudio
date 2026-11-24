import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe seu e-mail e senha." },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.id);
    const response = NextResponse.json({ user: toPublicUser(user) });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Falha ao entrar. Tente novamente." },
      { status: 500 }
    );
  }
}
