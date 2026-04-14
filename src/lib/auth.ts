import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { UserStatus, Role } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password diperlukan")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          throw new Error("Email tidak ditemukan")
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          throw new Error("Password salah")
        }

        if (user.status === UserStatus.PENDING) {
          throw new Error("PENDING: Akun Anda menunggu persetujuan admin")
        }

        if (user.status === UserStatus.REJECTED) {
          throw new Error("REJECTED: Akun Anda telah ditolak oleh admin")
        }

        if (user.status === UserStatus.SUSPENDED) {
          throw new Error("SUSPENDED: Akun Anda telah disuspend")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar ?? undefined,
          department: user.department ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
        token.status = (user as { status: UserStatus }).status
        token.avatar = (user as { avatar?: string }).avatar
        token.department = (user as { department?: string }).department
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.status = token.status as UserStatus
        session.user.avatar = token.avatar as string | undefined
        session.user.department = token.department as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
})
