"use client" // Make it a client component

import { useState, useEffect } from "react" // Import hooks
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// Removed CreditCard icon, added CalendarDays, Megaphone
import { Users, FileText, AlertCircle, CalendarDays, Megaphone } from "lucide-react"
import Link from "next/link"

// Define type for the summary data
type DashboardSummaryData = {
  guildName: string | null;
  guildStatus: string;
  documentCount: number;
  paymentStatus: { // Placeholder structure
    balance: number;
    statusText: string;
  };
  upcomingEvents: any[] | string; // Can be array or message
  guildAnnouncements: any[] | string; // Can be array or message
  profileComplete?: boolean; // Add profile completion status
};

export default function Dashboard() {
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard summary");
        }
        const data: DashboardSummaryData = await response.json();
        setSummaryData(data);
      } catch (err) {
        console.error("Fetch dashboard summary error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (error) {
     return (
        <div className="p-6 space-y-4">
             <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
        </div>
     );
  }
   
  // Handle case where data might be null even if fetch succeeded (e.g., API logic)
  if (!summaryData) {
     return (
         <div className="p-6 space-y-4">
             <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
             <p>Could not load dashboard data.</p>
         </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic alert based on profile completion status */}
      {summaryData.profileComplete === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Complete your profile</AlertTitle>
          <AlertDescription>Please complete your profile and select your guild to access all features.</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Guild Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guild Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.guildName || "N/A"}</div>
            <p className="text-xs text-muted-foreground">{summaryData.guildStatus}</p>
            {/* Link to view guild details - maybe disable if no guild or link to profile/guild selection? */}
            <Button disabled={!summaryData.guildName} asChild className="w-full mt-4" variant="outline" size="sm">
              {/* Update href if a user-facing guild page exists */}
              <Link href={summaryData.guildName ? `/guilds/${summaryData.guildName}` : "#"}>View Guild Details</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.documentCount}</div>
            <p className="text-xs text-muted-foreground">Available documents</p>
            <Button asChild className="w-full mt-4" variant="outline" size="sm">
              <Link href="/dashboard/documents">View Documents</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Payment Status Card - Using placeholder data */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            {/* Re-add CreditCard icon if needed */}
            {/* <CreditCard className="h-4 w-4 text-muted-foreground" /> */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData.paymentStatus.balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{summaryData.paymentStatus.statusText}</p>
            <Button disabled className="w-full mt-4" variant="outline" size="sm">
              {/* <Link href="/dashboard/payments">View Payment History</Link> */}
               View Payment History (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Events and Announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Events Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next events in your calendar</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof summaryData.upcomingEvents === 'string' ? (
              <p className="text-sm text-muted-foreground">{summaryData.upcomingEvents}</p>
            ) : (
              <div className="space-y-4">
                {summaryData.upcomingEvents.map((event) => (
                  <div key={event.id}>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guild Announcements Card */}
        <Card>
          <CardHeader>
            <CardTitle>Guild Announcements</CardTitle>
            <CardDescription>Latest updates from your guild</CardDescription>
          </CardHeader>
          <CardContent>
             {typeof summaryData.guildAnnouncements === 'string' ? (
              <p className="text-sm text-muted-foreground">{summaryData.guildAnnouncements}</p>
            ) : (
              <div className="space-y-4">
                {summaryData.guildAnnouncements.map((announcement) => (
                  <div key={announcement.id}>
                    <p className="font-medium">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
