import {
  Prisma,
  ProjectRole,
} from "@/generated/prisma/client";

import { prisma } from "@/server/db/client";
import { slugify } from "@/server/utils/slugify";

const snapshotsArgs = {
  select: { id: true, label: true, createdAt: true, createdById: true },
  orderBy: { createdAt: Prisma.SortOrder.desc },
  take: 5,
} satisfies Prisma.Project$snapshotsArgs;

export const projectInclude = {
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
  snapshots: snapshotsArgs,
} satisfies Prisma.ProjectInclude;

async function ensureUniqueSlug(name: string, currentId?: string) {
  const base = slugify(name) || "project";
  let slug = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (!existing || existing.id === currentId) {
      return slug;
    }
    slug = `${base}-${counter++}`;
  }
}

async function listProjectsForUser(userId: string, search?: string) {
  return prisma.project.findMany({
    where: {
      AND: [
        {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: projectInclude,
  });
}

async function createProject(userId: string, name: string, description?: string | null) {
  const slug = await ensureUniqueSlug(name);

  return prisma.project.create({
    data: {
      name,
      description: description?.trim() || null,
      slug,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: ProjectRole.OWNER,
        },
      },
    },
    include: projectInclude,
  });
}

async function getProjectForUser(projectId: string, userId: string, include = projectInclude) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: projectInclude,
  });
}

async function getProjectWithMembership(projectId: string, userId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: true,
      members: {
        where: { userId },
      },
    },
  });
}

async function updateProject(projectId: string, data: Record<string, unknown>, include = projectInclude) {
  return prisma.project.update({
    where: { id: projectId },
    data,
    include: projectInclude,
  });
}

async function deleteProject(projectId: string) {
  return prisma.project.delete({ where: { id: projectId } });
}

async function generateProjectSlug(name: string, projectId?: string) {
  return ensureUniqueSlug(name, projectId);
}

export const projectService = {
  list: listProjectsForUser,
  create: createProject,
  getForUser: getProjectForUser,
  getWithMembership: getProjectWithMembership,
  update: updateProject,
  delete: deleteProject,
  generateSlug: generateProjectSlug,
};

