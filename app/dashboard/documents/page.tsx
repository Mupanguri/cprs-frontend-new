import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

export default function DocumentsPage() {
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
      fileSize: "2.1 MB",
    },
  ]

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
                <CardTitle>{doc.title}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Added on: {new Date(doc.date).toLocaleDateString()}</p>
                <p>File type: {doc.fileType}</p>
                <p>Size: {doc.fileSize}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
