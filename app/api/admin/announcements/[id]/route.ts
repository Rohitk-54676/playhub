import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 };
  const me = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!me?.isAdmin) return { error: "Forbidden", status: 403 };
  return { error: null, status: 200 };
}

// PATCH — toggle active
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { active } = await req.json();

  try {
    await prisma.announcement.update({
      where: { id },
      data: { active: !!active },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH announcement error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE announcement error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}