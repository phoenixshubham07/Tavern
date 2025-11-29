import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
        credentials: {
            email: {},
            password: {},
        },
        authorize: async (credentials) => {
            // MOCK AUTHENTICATION
            // In a real app, you would verify credentials against a database
            if (credentials?.email === "test@example.com" && credentials?.password === "password") {
                return {
                    id: "1",
                    name: "Test User",
                    email: "test@example.com",
                }
            }
            // Return null if user data could not be retrieved
            return null
        },
    }),
  ],
})
