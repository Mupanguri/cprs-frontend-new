"use client" // Make it a client component

import { useState, useEffect } from "react" // Import hooks
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, AlertCircle } from "lucide-react" // Added AlertCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Added Alert components
import Link from "next/link" // Import Link for download button

// Define type for Document based on Prisma schema
type Document = {
  id: string;
  guildId?: string | null;
  name: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number; // Assuming size is in bytes from schema
  createdAt: string; // ISO string date
  updatedAt: string;
  // guild?: { name: string }; // If guild info is included in API response
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/documents");
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const data: Document[] = await response.json();
        setDocuments(data);
      } catch (err) {
        console.error("Fetch documents error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Helper function to format file size
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (!bytes || bytes === 0) return '0 Bytes'; // Handle null or 0 bytes
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    // Handle potential log(0) or negative bytes if necessary, though fileSize should be positive
    if (bytes <= 0) return '0 Bytes'; 
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    // Ensure index i is within bounds of sizes array
    const index = Math.min(i, sizes.length - 1); 
    return parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index];
  }

  if (isLoading) {
    return <div className="p-6">Loading documents...</div>;
  }

  if (error) {
     return (
        <div className="p-6 space-y-4">
             <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Fetching Documents</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
        </div>
     );
  }

  // Original static documents array - remove this section
  /*
  const documents = [
    {
      id: 1,
      title: "Guild Constitution",
      description: "The official constitution and bylaws of St. Mary's Guild",
      date: "2024-01-15",
      fileType: "PDF",
      fileSize: "1.2 MB",
    },
    {
      id: 2,
      title: "Guild Prayers",
      description: "Collection of prayers for guild members",
      date: "2024-01-15",
      fileType: "PDF",
      fileSize: "0.8 MB",
    },
    {
      id: 3,
      title: "Guild Fee Guidelines",
      description: "Information about guild membership fees and payment schedules",
      date: "2024-02-10",
      fileType: "PDF",
      fileSize: "0.5 MB",
    },
    {
      id: 4,
      title: "Parish Calendar 2025",
      description: "Annual calendar of parish events and liturgical celebrations",
      date: "2024-11-30",
      fileType: "PDF",
      fileSize: "2.1 MB", // This static data is now replaced by fetched data
    },
  ]
  */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-md">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                {/* Use doc.name instead of doc.title */}
                <CardTitle>{doc.name}</CardTitle> 
                <CardDescription>{doc.description || 'No description available'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                 {/* Use doc.createdAt instead of doc.date */}
                <p>Added on: {new Date(doc.createdAt).toLocaleDateString()}</p> 
                <p>File type: {doc.fileType}</p>
                 {/* Use formatBytes helper for doc.fileSize */}
                <p>Size: {formatBytes(doc.fileSize)}</p> 
              </div>
            </CardContent>
            <CardFooter>
              {/* Use Link styled as Button for download */}
              <Button className="w-full" asChild>
                <Link href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
