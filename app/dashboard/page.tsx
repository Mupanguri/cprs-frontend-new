import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, FileText, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Welcome to your dashboard</AlertTitle>
        <AlertDescription>Please complete your profile and select your guild to access all features.</AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guild Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">St. Mary's Guild</div>
            <p className="text-xs text-muted-foreground">Active Member</p>
            <Button asChild className="w-full mt-4" variant="outline" size="sm">
              <Link href="/dashboard/guilds">View Guild Details</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Available documents</p>
            <Button asChild className="w-full mt-4" variant="outline" size="sm">
              <Link href="/dashboard/documents">View Documents</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$120.00</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
            <Button asChild className="w-full mt-4" variant="outline" size="sm">
              <Link href="/dashboard/payments">View Payment History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next events in your calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Advent Begins</p>
                  <p className="text-xs text-muted-foreground">Dec 1, 2024</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-white mr-2 border"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Christmas Day</p>
                  <p className="text-xs text-muted-foreground">Dec 25, 2024</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-white mr-2 border"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mary, Mother of God</p>
                  <p className="text-xs text-muted-foreground">Jan 1, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guild Announcements</CardTitle>
            <CardDescription>Latest updates from your guild</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Monthly Meeting</p>
                <p className="text-xs text-muted-foreground">
                  The next monthly meeting will be held on Sunday after the 10am Mass.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Annual Dues</p>
                <p className="text-xs text-muted-foreground">
                  Please remember to pay your annual dues by the end of the month.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Volunteer Opportunity</p>
                <p className="text-xs text-muted-foreground">We need volunteers for the upcoming parish festival.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
