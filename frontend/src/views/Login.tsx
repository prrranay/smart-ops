import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
})

type FormVals = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errVal, setErrVal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [show, setShow] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onInvalid = (errors: any) => {
    Object.values(errors).forEach((err: any) => {
      if (err.message) {
        toast(err.message, "error")
      }
    })
  }

  const onSubmit = async (data: FormVals) => {
    setErrVal(null)
    setIsSubmitting(true)
    try {
      await login(data.email, data.password)
      toast("Successfully signed in!", "success")
      
      const path = searchParams.get("redirect") || "/"
      navigate(path, { replace: true })
    } catch (err: any) {
      const msg = err.message || "Invalid email or password. Please try again."
      setErrVal(msg)
      toast(msg, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 shadow-md shadow-primary/25">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to SmartOps</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access the internal operations control panel.
          </p>
        </div>

        <Card className="glass-card shadow-lg border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your operator session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
              {errVal && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 p-3 text-xs text-destructive dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errVal}</span>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-zinc-650 dark:text-zinc-300"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  placeholder="name@company.com"
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive dark:text-red-400 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-zinc-650 dark:text-zinc-300"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors"
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive dark:text-red-400 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
