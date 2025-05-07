"use client"

import { useState, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Added Tabs import
import { PlusCircle, Edit, Trash2, Users, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Type for Guild data returned by API (includes memberCount)
type GuildData = {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

// Type for Fee data (placeholder - not fetched yet)
type FeeData = {
  id: number;
  guildId: number; // Should match GuildData id type (string)
  description: string;
  amount: number;
  frequency: string;
};

export default function GuildsPage() {
  // State for guilds
  const [guilds, setGuilds] = useState<GuildData[]>([]);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(true);
  const [guildsError, setGuildsError] = useState<string | null>(null);

  // State for fees (placeholder)
  const [fees, setFees] = useState<FeeData[]>([]); // Placeholder

  // State for dialogs
  const [showAddGuildDialog, setShowAddGuildDialog] = useState(false);
  const [showEditGuildDialog, setShowEditGuildDialog] = useState(false);
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false); // Placeholder
  
  // State for forms
  const [newGuildName, setNewGuildName] = useState("");
  const [newGuildDescription, setNewGuildDescription] = useState("");
  const [editingGuild, setEditingGuild] = useState<GuildData | null>(null); // Guild being edited
  
  // State for actions
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch guilds function
  const fetchGuilds = async () => {
    setIsLoadingGuilds(true);
    setGuildsError(null);
    try {
      const response = await fetch("/api/admin/guilds");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch guilds");
      }
      const data: GuildData[] = await response.json();
      setGuilds(data);
    } catch (err) {
      console.error("Fetch guilds error:", err);
      setGuildsError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  // Fetch guilds on mount
  useEffect(() => {
    fetchGuilds();
  }, []);

  // Handle Add Guild submission
  const handleAddGuild = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setActionError(null);
    try {
      const response = await fetch("/api/admin/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGuildName, description: newGuildDescription }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add guild");
      }
      setShowAddGuildDialog(false);
      setNewGuildName(""); // Reset form
      setNewGuildDescription("");
      fetchGuilds(); // Refresh list
    } catch (err) {
      console.error("Add guild error:", err);
      setActionError(err instanceof Error ? err.message : "An unknown error occurred");
      // Keep dialog open on error
    } finally {
      setIsSaving(false);
    }
  };
  
   // Handle Edit Guild submission
   const handleEditGuild = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGuild) return;

    setIsSaving(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/guilds/${editingGuild.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingGuild.name, description: editingGuild.description }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update guild");
      }
      setShowEditGuildDialog(false);
      setEditingGuild(null); // Reset editing state
      fetchGuilds(); // Refresh list
    } catch (err) {
      console.error("Update guild error:", err);
      setActionError(err instanceof Error ? err.message : "An unknown error occurred");
      // Keep dialog open on error
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Guild
  const handleDeleteGuild = async (guildId: string, guildName: string) => {
     if (!confirm(`Are you sure you want to delete the guild "${guildName}"? This will also affect associated members, fees, and documents.`)) {
         return;
     }
     setActionError(null);
     try {
        const response = await fetch(`/api/admin/guilds/${guildId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete guild');
        }
        alert(`Guild "${guildName}" deleted successfully.`);
        fetchGuilds(); // Refresh list
     } catch (err) {
         console.error("Delete guild error:", err);
         alert(`Error deleting guild: ${err instanceof Error ? err.message : "Unknown error"}`);
     }
  };
  
  // Open Edit Dialog
  const openEditDialog = (guild: GuildData) => {
      setEditingGuild({...guild}); // Set the guild to be edited
      setActionError(null); // Clear previous errors
      setShowEditGuildDialog(true);
  };
  
  // Update editingGuild state when form fields change in Edit Dialog
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!editingGuild) return;
      const { id, value } = e.target;
      setEditingGuild(prev => prev ? { ...prev, [id]: value } : null);
  };


  // Placeholder handlers for fees/documents
  const handleAddFee = () => alert("Add Fee functionality not implemented.");
  const handleAddDocument = () => alert("Add Document functionality not implemented.");
  const handleEditFee = (feeId: number) => alert(`Edit Fee ${feeId} not implemented.`);
  const handleDeleteFee = (feeId: number) => alert(`Delete Fee ${feeId} not implemented.`);
  // ... similar placeholders for document actions


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Guild Management</h2>
        {/* Add Guild Dialog Trigger */}
        <Dialog open={showAddGuildDialog} onOpenChange={setShowAddGuildDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Guild
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddGuild}>
              <DialogHeader>
                <DialogTitle>Add New Guild</DialogTitle>
                <DialogDescription>Create a new guild for parish members to join.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 {actionError && (
                    <Alert variant="destructive">
                       <AlertCircle className="h-4 w-4" />
                       <AlertTitle>Error</AlertTitle>
                       <AlertDescription>{actionError}</AlertDescription>
                    </Alert>
                 )}
                <div className="space-y-2">
                  <Label htmlFor="guild-name">Guild Name</Label>
                  <Input 
                    id="guild-name" 
                    placeholder="e.g., St. Patrick's Guild" 
                    value={newGuildName}
                    onChange={(e) => setNewGuildName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guild-description">Description</Label>
                  <Textarea 
                    id="guild-description" 
                    placeholder="Describe the purpose and activities of this guild" 
                    value={newGuildDescription}
                    onChange={(e) => setNewGuildDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Creating..." : "Create Guild"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display Guild Fetch Error */}
      {guildsError && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Guilds</AlertTitle>
            <AlertDescription>{guildsError}</AlertDescription>
         </Alert>
       )}

      <Tabs defaultValue="guilds">
        <TabsList>
          <TabsTrigger value="guilds">Guilds</TabsTrigger>
          <TabsTrigger value="fees" disabled>Guild Fees</TabsTrigger> {/* Disabled for now */}
          <TabsTrigger value="documents" disabled>Guild Documents</TabsTrigger> {/* Disabled for now */}
        </TabsList>

        {/* Guilds Tab */}
        <TabsContent value="guilds" className="space-y-4 mt-4">
          {isLoadingGuilds ? (
            <p>Loading guilds...</p>
          ) : guilds.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {guilds.map((guild) => (
                <Card key={guild.id}>
                  <CardHeader>
                    <CardTitle>{guild.name}</CardTitle>
                    <CardDescription>{guild.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{guild.memberCount} members</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" disabled> {/* View members not implemented */}
                      <Users className="mr-2 h-4 w-4" />
                      View Members
                    </Button>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(guild)} title="Edit Guild">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGuild(guild.id, guild.name)} title="Delete Guild">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
             <p>No guilds found. Add one to get started.</p>
          )}
        </TabsContent>

        {/* Fees Tab (Placeholder) */}
        <TabsContent value="fees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guild Fees</CardTitle>
                <CardDescription>Manage membership and other fees for each guild</CardDescription>
              </div>
              <Button onClick={handleAddFee} disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Fee
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Fee management coming soon.</p>
              {/* Placeholder Table */}
              {/* <Table> ... </Table> */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab (Placeholder) */}
        <TabsContent value="documents">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guild Documents</CardTitle>
                <CardDescription>Manage documents for each guild</CardDescription>
              </div>
              <Button onClick={handleAddDocument} disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground">Guild document management coming soon.</p>
               {/* Placeholder Table */}
               {/* <Table> ... </Table> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Guild Dialog */}
      <Dialog open={showEditGuildDialog} onOpenChange={setShowEditGuildDialog}>
        <DialogContent>
          <form onSubmit={handleEditGuild}>
            <DialogHeader>
              <DialogTitle>Edit Guild: {editingGuild?.name}</DialogTitle>
              <DialogDescription>Update the guild details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               {actionError && (
                  <Alert variant="destructive">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Error</AlertTitle>
                     <AlertDescription>{actionError}</AlertDescription>
                  </Alert>
               )}
              <div className="space-y-2">
                <Label htmlFor="name">Guild Name</Label>
                <Input 
                  id="name" 
                  value={editingGuild?.name ?? ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={editingGuild?.description ?? ''}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={() => setEditingGuild(null)}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Fee Dialog (Placeholder Structure) */}
      {/* 
      <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
        <DialogContent> ... </DialogContent>
      </Dialog> 
      */}
    </div>
  )
}
