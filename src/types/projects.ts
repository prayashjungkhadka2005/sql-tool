import { ProjectRole } from "@/generated/prisma/client";
import { SchemaState } from "@/features/schema-designer/types";

export interface ProjectMemberSummary {
  id: string;
  role: ProjectRole;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export interface ProjectOwnerSummary {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  ownerId: string;
  owner?: ProjectOwnerSummary;
  createdAt: string;
  updatedAt: string;
  schemaVersion?: number;
  currentSchema: SchemaState | null;
  members: ProjectMemberSummary[];
}


