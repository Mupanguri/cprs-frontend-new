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
  upcomingEvents: any[]; // Placeholder type
  guildAnnouncements: any[]; // Placeholder type
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
      {/* TODO: Make this alert dynamic based on profile completion status */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Welcome to your dashboard</AlertTitle>
        <AlertDescription>Please complete your profile and select your guild to access all features.</AlertDescription>
      </Alert>

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
              {/* TODO: Update href if a user-facing guild page exists */}
              <Link href="#">View Guild Details</Link> 
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
            {summaryData.upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {/* TODO: Map over summaryData.upcomingEvents */}
                <p className="text-sm text-muted-foreground">Event data not yet implemented.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events found.</p>
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
             {summaryData.guildAnnouncements.length > 0 ? (
              <div className="space-y-4">
                 {/* TODO: Map over summaryData.guildAnnouncements */}
                 <p className="text-sm text-muted-foreground">Announcement data not yet implemented.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
