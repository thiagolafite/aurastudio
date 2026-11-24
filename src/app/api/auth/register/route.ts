import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  toPublicUser,
} from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      agencyName?: string;
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const agencyName = body.agencyName?.trim() || undefined;

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Informe seu nome completo (mínimo 2 caracteres)." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    const user = await createUser({
      name,
      email,
      agencyName,
      passwordHash: hashPassword(password),
      role: "admin",
    });

    const token = createSessionToken(user.id);
    const response = NextResponse.json(
      { user: toPublicUser(user) },
      { status: 201 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Falha ao realizar cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
