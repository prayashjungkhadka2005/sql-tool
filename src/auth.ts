import { getServerSession } from "next-auth";

import { authOptions, handlers, signIn, signOut } from "@/server/auth/options";

export { handlers, signIn, signOut };

export async function auth() {
  return getServerSession(authOptions);
}