"use client"

import type React from "react"
import { useState, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
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
import { UserPlus, FileSpreadsheet, Send, Edit, Trash2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added Select for Role

// Define type for the user data returned by the API
type FormattedUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    guild: string;
    status: string; // e.g., 'Active', 'Pending Setup', 'Unknown'
    createdAt: string; // ISO string date
    updatedAt: string;
    // Add profile fields if needed for editing directly here
    profile?: { 
        firstName?: string | null;
        surname?: string | null;
        // Add other fields from FamilyCensus if editing them via this dialog
    } | null;
};

// Type for Add/Edit User Form Data
type UserFormData = {
    id?: string; // Present when editing
    email: string;
    firstName: string;
    surname: string;
    role: string; // 'member' or 'admin'
    // Add other fields if needed in Add/Edit dialog
};

export default function UsersPage() {
  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  
  // Data states
  const [users, setUsers] = useState<FormattedUser[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserFormData>({ email: '', firstName: '', surname: '', role: 'member' }); // For Add/Edit form
  
  // Status states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Generic saving state for Add/Edit
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null); // For fetch errors
  const [actionError, setActionError] = useState<string | null>(null); // For dialog action errors
  
  // Filtering state
  const [activeTab, setActiveTab] = useState("all");

  // Fetch users function
  const fetchUsers = async () => {
    setIsLoading(true); 
    setError(null); 
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        let errorMsg = "Failed to fetch users";
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (_) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      const data: FormattedUser[] = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on active tab
  const filteredUsers = users.filter(user => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return user.status === "Pending Setup";
    if (activeTab === "active") return user.status === "Active";
    // if (activeTab === "inactive") return user.status === "Inactive"; // Needs status implementation
    return true; 
  });

  // --- Action Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setActionError(null); 
    }
  }

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setActionError(null);
    const formDataApi = new FormData();
    formDataApi.append("file", file);
    try {
      const response = await fetch("/api/admin/upload-users", { method: "POST", body: formDataApi });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      alert(`Upload successful! ${result.message}`);
      setShowUploadDialog(false);
      setFile(null);
      fetchUsers(); 
    } catch (err) {
      console.error("Upload error:", err);
      setActionError(err instanceof Error ? err.message : "An unknown error occurred during upload");
    } finally {
       setIsUploading(false);
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
     setActionError(null);
     if (!confirm(`Are you sure you want to delete user ${userName} (${userId})? This action cannot be undone.`)) return;
     try {
        const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to delete user');
        alert(`User ${userName} deleted successfully.`);
        fetchUsers(); 
     } catch (err) {
         console.error("Delete user error:", err);
         const errorMsg = err instanceof Error ? err.message : "Unknown error during deletion";
         alert(`Error deleting user: ${errorMsg}`);
         setActionError(errorMsg);
      }
   };
   
   // Implement Send Setup Link API call
   const handleSendInvite = async (userId: string) => {
      setActionError(null);
      // Maybe add a loading state specific to this action?
      if (!confirm(`Are you sure you want to send/resend a password setup link to this user?`)) {
          return;
      }
      try {
          const response = await fetch(`/api/admin/users/${userId}/resend-setup`, { method: 'POST' });
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || 'Failed to send setup link');
          }
          alert(result.message || 'Setup link sent successfully.'); // Use message from API
      } catch (err) {
          console.error("Send invite error:", err);
          const errorMsg = err instanceof Error ? err.message : "Unknown error sending invite";
          alert(`Error sending setup link: ${errorMsg}`);
          setActionError(errorMsg);
      }
   };
 
   // --- Add/Edit User Handlers ---

  const openAddUserDialog = () => {
      setActionError(null);
      setCurrentUserData({ email: '', firstName: '', surname: '', role: 'member' }); // Reset form
      setShowAddUserDialog(true);
  };

  const openEditUserDialog = (user: FormattedUser) => {
      setActionError(null);
      // Pre-fill form data - assumes basic fields are editable here
      setCurrentUserData({ 
          id: user.id, 
          email: user.email, 
          // Extract first/last name if possible, otherwise use full name as placeholder
          firstName: user.name.split(' ')[0] || '', 
          surname: user.name.split(' ').slice(1).join(' ') || '', 
          role: user.role.toLowerCase().includes('admin') ? 'admin' : 'member' // Simple role check
      });
      setShowEditUserDialog(true);
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setCurrentUserData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleRoleSelectChange = (value: string) => {
      setCurrentUserData(prev => ({ ...prev, role: value }));
  };

  const handleAddUserSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!currentUserData.email || !currentUserData.firstName || !currentUserData.surname) {
          setActionError("Email, First Name, and Surname are required.");
          return;
      }
      setIsSaving(true);
      setActionError(null);
      try {
          const response = await fetch('/api/admin/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentUserData)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Failed to add user");
          
          alert("User added successfully!");
          setShowAddUserDialog(false);
          fetchUsers(); // Refresh list
      } catch (err) {
          console.error("Add user error:", err);
          setActionError(err instanceof Error ? err.message : "Unknown error adding user");
      } finally {
          setIsSaving(false);
      }
  };

  const handleEditUserSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!currentUserData.id) return; // Should not happen if opened correctly
       if (!currentUserData.email || !currentUserData.firstName || !currentUserData.surname) {
          setActionError("Email, First Name, and Surname are required.");
          return;
      }
      setIsSaving(true);
      setActionError(null);
      try {
          // Only send fields that might change (e.g., email, role, potentially name parts if profile updated)
          const dataToSend = {
              email: currentUserData.email,
              role: currentUserData.role,
              // If editing profile fields directly:
              // firstName: currentUserData.firstName, 
              // surname: currentUserData.surname,
          };
          const response = await fetch(`/api/admin/users/${currentUserData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataToSend)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Failed to update user");

          alert("User updated successfully!");
          setShowEditUserDialog(false);
          fetchUsers(); // Refresh list
      } catch (err) {
          console.error("Edit user error:", err);
          setActionError(err instanceof Error ? err.message : "Unknown error updating user");
      } finally {
          setIsSaving(false);
      }
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  if (error) {
     return (
        <div className="p-6 space-y-4">
             <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Users</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* Header + Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <div className="flex space-x-2">
          {/* Upload Dialog Trigger */}
          <Dialog open={showUploadDialog} onOpenChange={(isOpen) => { setShowUploadDialog(isOpen); if (!isOpen) setActionError(null); }}>
             {/* ... (Upload Dialog Content as before) ... */}
             <DialogTrigger asChild>
                <Button variant="outline">
                   <FileSpreadsheet className="mr-2 h-4 w-4" />
                   Upload Excel
                </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Upload User Data</DialogTitle>
                 <DialogDescription>
                   Upload an Excel file (.xls or .xlsx) with user information (email, firstName, surname required). 
                   Each new user will receive an email with a link to set up their password.
                 </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 {actionError && ( 
                    <Alert variant="destructive">
                       <AlertCircle className="h-4 w-4" />
                       <AlertTitle>Upload Error</AlertTitle>
                       <AlertDescription>{actionError}</AlertDescription>
                    </Alert>
                 )}
                 <div className="grid w-full max-w-sm items-center gap-1.5">
                   <Label htmlFor="excel-upload">Excel File</Label>
                   <Input id="excel-upload" type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
                 </div>
                 {/* Add download link for template */}
                 <div className="text-sm">
                    <a 
                        href="/user_upload_template.xlsx" 
                        download 
                        className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                        Download template (.xlsx)
                    </a>
                 </div>
                 <Alert>
                   <AlertTitle>Important</AlertTitle>
                   <AlertDescription>
                     Make sure your Excel file follows the required format (columns: email, firstName, surname, etc.). 
                     All users must have valid email addresses.
                   </AlertDescription>
                 </Alert>
               </div>
               <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                 </DialogClose>
                 <Button onClick={handleUpload} disabled={!file || isUploading}>
                   {isUploading ? "Uploading..." : "Upload and Send Setup Links"}
                 </Button>
               </DialogFooter>
             </DialogContent>
          </Dialog>

          {/* Add User Dialog Trigger */}
           <Dialog open={showAddUserDialog} onOpenChange={(isOpen) => { setShowAddUserDialog(isOpen); if (!isOpen) setActionError(null); }}>
             <DialogTrigger asChild>
                <Button onClick={openAddUserDialog}>
                   <UserPlus className="mr-2 h-4 w-4" />
                   Add User
                </Button>
             </DialogTrigger>
             <DialogContent>
                <form onSubmit={handleAddUserSubmit}>
                   <DialogHeader>
                     <DialogTitle>Add New User</DialogTitle>
                     <DialogDescription>Enter the details for the new user. They will receive an email to set up their password.</DialogDescription>
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
                       <Label htmlFor="email">Email</Label>
                       <Input id="email" type="email" placeholder="user@example.com" value={currentUserData.email} onChange={handleUserFormChange} required />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="firstName">First Name</Label>
                       <Input id="firstName" placeholder="John" value={currentUserData.firstName} onChange={handleUserFormChange} required />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="surname">Surname</Label>
                       <Input id="surname" placeholder="Doe" value={currentUserData.surname} onChange={handleUserFormChange} required />
                     </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={currentUserData.role} onValueChange={handleRoleSelectChange}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      {/* Add other fields here if needed */}
                   </div>
                   <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                     </DialogClose>
                     <Button type="submit" disabled={isSaving}>
                       {isSaving ? "Adding..." : "Add User & Send Invite"}
                     </Button>
                   </DialogFooter>
                </form>
             </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="pending">Pending Setup</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          {/* <TabsTrigger value="inactive">Inactive</TabsTrigger> */}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Guild</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.guild}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "Active" ? "default" 
                              : user.status === "Pending Setup" ? "secondary" 
                              : "outline" 
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleSendInvite(user.id)} title="Resend Setup Link">
                              <Send className="h-4 w-4" />
                            </Button>
                            {/* Trigger for Edit Dialog */}
                            <Dialog>
                               <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEditUserDialog(user)} title="Edit User">
                                     <Edit className="h-4 w-4" />
                                  </Button>
                               </DialogTrigger>
                               {/* Edit Dialog Content is separate, managed by showEditUserDialog state */}
                            </Dialog>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.name)} title="Delete User">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No users found{activeTab !== 'all' ? ` for status: ${activeTab}` : ''}.
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog (separate from trigger) */}
       <Dialog open={showEditUserDialog} onOpenChange={(isOpen) => { setShowEditUserDialog(isOpen); if (!isOpen) setActionError(null); }}>
         <DialogContent>
            <form onSubmit={handleEditUserSubmit}>
               <DialogHeader>
                 {/* Construct name from firstName and surname */}
                 <DialogTitle>Edit User: {`${currentUserData.firstName || ''} ${currentUserData.surname || ''}`.trim() || currentUserData.email}</DialogTitle> 
                 <DialogDescription>Update the user's details.</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  {actionError && ( 
                    <Alert variant="destructive">
                       <AlertCircle className="h-4 w-4" />
                       <AlertTitle>Error</AlertTitle>
                       <AlertDescription>{actionError}</AlertDescription>
                    </Alert>
                 )}
                 {/* Only allow editing certain fields like email and role here */}
                 {/* Editing name requires editing FamilyCensus, maybe link to profile? */}
                 <div className="space-y-2">
                   <Label htmlFor="email">Email</Label>
                   <Input id="email" type="email" value={currentUserData.email} onChange={handleUserFormChange} required />
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={currentUserData.role} onValueChange={handleRoleSelectChange}>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  {/* Add other editable fields if necessary */}
               </div>
               <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                 </DialogClose>
                 <Button type="submit" disabled={isSaving}>
                   {isSaving ? "Saving..." : "Save Changes"}
                 </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

    </div>
  )
}
