"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Crown, 
  Eye, 
  Edit,
  ArrowRight,
  AlertCircle
} from "lucide-react"

interface Invitation {
  id: string
  email: string
  role: string
  message?: string
  createdAt: string
  expiresAt: string
  sender: {
    name: string
    email: string
    image?: string
  }
  workspace: {
    name: string
    description?: string
  }
}

function InvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      fetchInvitation()
    }
  }, [token])

  const fetchInvitation = async () => {
    if (!token) {
      setError("No invitation token provided")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/invitations?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setInvitation(data.invitation)
      } else {
        setError(data.error || "Invitation not found")
      }
    } catch (error) {
      setError("Failed to load invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleInvitation = async (action: "accept" | "decline") => {
    if (!session?.user?.id) {
      router.push(`/auth/signin?callbackUrl=/invitations?token=${token}`)
      return
    }

    if (!token) {
      setError("No invitation token")
      return
    }

    setProcessing(true)
    setError("")

    try {
      const response = await fetch(`/api/invitations?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        if (action === "accept") {
          setSuccess("Invitation accepted! Redirecting to workspace...")
          setTimeout(() => {
            router.push("/eraser")
          }, 2000)
        } else {
          setSuccess("Invitation declined.")
        }
      } else {
        setError(data.error || `Failed to ${action} invitation`)
      }
    } catch (error) {
      setError(`Failed to ${action} invitation`)
    } finally {
      setProcessing(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "EDITOR":
        return <Edit className="w-4 h-4 text-blue-500" />
      case "VIEWER":
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "EDITOR":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "VIEWER":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Success!</CardTitle>
            <CardDescription>{success}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/eraser">Go to Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <CardTitle>No Invitation Found</CardTitle>
            <CardDescription>
              The invitation link appears to be invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Users className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <CardTitle>You&apos;re Invited to Collaborate!</CardTitle>
          <CardDescription>
            Join {invitation.workspace.name} and start collaborating
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Workspace Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-1">{invitation.workspace.name}</h3>
            {invitation.workspace.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {invitation.workspace.description}
              </p>
            )}
          </div>

          {/* Sender Info */}
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={invitation.sender.image} />
              <AvatarFallback>{getInitials(invitation.sender.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{invitation.sender.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invitation.sender.email}
              </p>
            </div>
          </div>

          {/* Role & Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getRoleIcon(invitation.role)}
                <span className="font-medium">Role:</span>
              </div>
              <Badge className={getRoleBadgeColor(invitation.role)}>
                {invitation.role}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Expires:</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>

            {invitation.message && (
              <>
                <Separator />
                <div>
                  <p className="font-medium mb-2">Message:</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                    "{invitation.message}"
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {isExpired ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-800 dark:text-red-200">
                This invitation has expired.
              </p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={() => handleInvitation("accept")}
                disabled={processing}
              >
                Accept Invitation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleInvitation("decline")}
                disabled={processing}
              >
                Decline
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main component with Suspense boundary
export default function InvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <InvitationContent />
    </Suspense>
  )
} 