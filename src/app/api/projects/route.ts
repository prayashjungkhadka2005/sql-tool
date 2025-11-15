"use server";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { projectService } from "@/server/projects/project.service";


const projectInclude = {
  owner: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  members: {
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  },
};

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search")?.trim();
  const projects = await projectService.list(userId, search);

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { name?: string; description?: string | null } = {};
  try {
    payload = await req.json();
  } catch (error) {
    return badRequest("Invalid JSON body");
  }

  const name = payload.name?.trim();
  if (!name || name.length < 2) {
    return badRequest("Project name must be at least 2 characters long.");
  }

  try {
    const project = await projectService.create(userId, name, payload.description);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[projects:POST]", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

