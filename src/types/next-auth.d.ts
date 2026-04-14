import { Role, UserStatus } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      status: UserStatus
      avatar?: string
      department?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    status: UserStatus
    avatar?: string
    department?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    status: UserStatus
    avatar?: string
    department?: string
  }
}
