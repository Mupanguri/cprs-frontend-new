"use client" // Required for useState, useRouter, event handlers

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Added for errors
import Image from "next/image"
import { AlertCircle } from "lucide-react" // Added for error icon

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Client-side validation
    if (!email) {
      setError("Email is required.")
      return
    }

    if (!password) {
      setError("Password is required.")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually based on result
        email,
        password,
      })

      if (result?.error) {
        // Handle specific errors if needed, e.g., result.error === 'CredentialsSignin'
        setError("Invalid email or password. Please try again.")
        setIsLoading(false)
      } else if (result?.ok) {
        // Login successful, redirect to dashboard
        router.push("/dashboard")
        // No need to setIsLoading(false) as we are navigating away
      } else {
        // Handle other potential issues
        setError("An unknown error occurred during login.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2">
          {/* Corrected image path assuming 'dashboard icon.png' in public */}
          <Image src="/public/dashboard_icon.png" alt="St. Agnes Parish" width={120} height={120} className="rounded-full" />
          <h1 className="text-2xl font-bold">St. Agnes Parish</h1>
          <p className="text-muted-foreground text-center">Welcome to the St. Agnes Parish Management System</p>
        </div>

        <Card>
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Account Login</CardTitle>
              <CardDescription>Enter your email and password to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
