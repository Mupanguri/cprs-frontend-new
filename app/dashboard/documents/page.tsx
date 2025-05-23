"use client" // Make it a client component

import { useState, useEffect } from "react" // Import hooks
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, AlertCircle } from "lucide-react" // Added AlertCircle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Added Alert components
import Link from "next/link" // Import Link for download button
import { ChevronLeft, ChevronRight } from "lucide-react";

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

type DocumentResponse = {
  documents: Document[];
  totalPages: number;
  currentPage: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/documents?page=${currentPage}`);
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const data: DocumentResponse = await response.json();
        setDocuments(data.documents);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Fetch documents error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, [currentPage]);

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

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

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
