import { NextRequest, NextResponse } from "next/server";

import { ProjectRole } from "@/generated/prisma/client";
import { auth } from "@/auth";
import {
  projectInclude,
  projectService,
} from "@/server/projects/project.service";

async function ensureUniqueSlug(name: string, currentId: string) {
  return projectService.generateSlug(name, currentId);
}

async function getProjectForUser(projectId: string, userId: string) {
  return projectService.getForUser(projectId, userId, projectInclude);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectForUser(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await projectService.getWithMembership(projectId, userId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const membership = project.members[0];
  const isOwner = project.ownerId === userId;
  const canEditSchema =
    isOwner || membership?.role === ProjectRole.EDITOR || membership?.role === ProjectRole.OWNER;
  const canEditMeta = isOwner;

  let payload: {
    name?: string;
    description?: string | null;
    currentSchema?: unknown;
  } = {};

  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    if (!canEditMeta) {
      return NextResponse.json(
        { error: "Only owners can rename projects" },
        { status: 403 }
      );
    }
    const trimmedName = payload.name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Project name must be at least 2 characters long." },
        { status: 400 }
      );
    }
    data.name = trimmedName;
    data.slug = await ensureUniqueSlug(trimmedName, project.id);
  }

  if (payload.description !== undefined) {
    if (!canEditMeta) {
      return NextResponse.json(
        { error: "Only owners can edit the description" },
        { status: 403 }
      );
    }
    data.description = payload.description?.trim() || null;
  }

  if (payload.currentSchema !== undefined) {
    if (!canEditSchema) {
      return NextResponse.json(
        { error: "You do not have permission to update this schema." },
        { status: 403 }
      );
    }
    data.currentSchema = payload.currentSchema;
    data.schemaVersion = { increment: 1 };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided for update." },
      { status: 400 }
    );
  }

  const updated = await projectService.update(project.id, data, projectInclude);

  return NextResponse.json({ project: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await projectService.getWithMembership(projectId, userId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json(
      { error: "Only the owner can delete this project" },
      { status: 403 }
    );
  }

  await projectService.delete(projectId);

  return NextResponse.json({ success: true });
}

