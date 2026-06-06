import React, { createContext, useContext, useState, useEffect } from "react"
import { api } from "@/config/axios"

export interface User {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "MANAGER"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (name: string, email: string, password: string, role?: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verify session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await api.get("/auth/me")
        if (response.data?.status === "success" && response.data?.data?.user) {
          setUser(response.data.data.user)
          localStorage.setItem("auth_user", JSON.stringify(response.data.data.user))
        } else {
          // Clear if structure is invalid
          logout()
        }
      } catch (err) {
        // Token was invalid or server failed
        localStorage.removeItem("auth_user")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post("/auth/login", { email, password })
    if (response.data?.status === "success" && response.data?.data) {
      const { user: loggedUser } = response.data.data
      localStorage.setItem("auth_user", JSON.stringify(loggedUser))
      setUser(loggedUser)
      return loggedUser
    }
    throw new Error("Invalid response format from server")
  }

  const signup = async (
    name: string,
    email: string,
    password: string,
    role = "USER"
  ): Promise<User> => {
    const response = await api.post("/auth/signup", { name, email, password, role })
    if (response.data?.status === "success" && response.data?.data) {
      const { user: loggedUser } = response.data.data
      localStorage.setItem("auth_user", JSON.stringify(loggedUser))
      setUser(loggedUser)
      return loggedUser
    }
    throw new Error("Invalid response format from server")
  }

  const logout = () => {
    api.post("/auth/logout").catch((err) => {
      console.error("Failed to clear cookie on backend logout", err)
    })
    localStorage.removeItem("auth_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
