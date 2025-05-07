"use client"

import { useState, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CheckCircle, AlertCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea" // Added Textarea for comments

// Define a type for the profile data structure based on FamilyCensus model
type ProfileData = {
  id?: string;
  userId?: string;
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null; // Store as ISO string or yyyy-MM-dd
  maritalStatus?: string | null;
  typeOfMarriage?: string | null;
  placeOfMarriage?: string | null;
  marriageNumber?: string | null;
  marriedTo?: string | null;
  address?: string | null;
  phoneCellNumber?: string | null;
  sectionName?: string | null;
  emailAddress?: string | null; // This comes from User model ideally
  placeOfBaptism?: string | null;
  baptismNumber?: string | null;
  groupsGuild?: string | null; // Need separate handling
  occupation?: string | null;
  skills?: string | null;
  profession?: string | null;
  churchSupportCard?: string | null;
  lastPaid?: string | null; // Need separate handling
  anyOtherComments?: string | null;
  dateOfSubmission?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  email?: string | null; // Added from User model merge in API
};


export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  // Use a single state object for form data
  const [formData, setFormData] = useState<ProfileData>({});
  const [isLoading, setIsLoading] = useState(true); // For initial fetch
  const [isSaving, setIsSaving] = useState(false); // For saving changes
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await fetch("/api/users/me");
        if (!response.ok) {
           if (response.status === 404 || (await response.clone().json()) === null) {
             // Handle case where profile doesn't exist yet (API returns null or 404)
             setProfileData(null); 
             setFormData({}); // Start with empty form
           } else {
             throw new Error(`Failed to fetch profile data (status: ${response.status})`);
           }
        } else {
            const data: ProfileData | null = await response.json();
             if (data) {
                setProfileData(data);
                // Initialize form data - handle null profile and null fields
                const initialFormData = {
                  title: data.title ?? '',
                  firstName: data.firstName ?? '',
                  middleName: data.middleName ?? '',
                  surname: data.surname ?? '',
                  gender: data.gender ?? '',
                  // Format date for input type="date" (yyyy-MM-dd)
                  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
                  maritalStatus: data.maritalStatus ?? '',
                  address: data.address ?? '',
                  phoneCellNumber: data.phoneCellNumber ?? '',
                  email: data.email ?? '', // Use merged email
                  placeOfBaptism: data.placeOfBaptism ?? '',
                  baptismNumber: data.baptismNumber ?? '',
                  typeOfMarriage: data.typeOfMarriage ?? '',
                  placeOfMarriage: data.placeOfMarriage ?? '',
                  marriageNumber: data.marriageNumber ?? '',
                  marriedTo: data.marriedTo ?? '',
                  sectionName: data.sectionName ?? '',
                  churchSupportCard: data.churchSupportCard ?? '',
                  occupation: data.occupation ?? '',
                  skills: data.skills ?? '',
                  profession: data.profession ?? '',
                  anyOtherComments: data.anyOtherComments ?? '',
                };
                setFormData(initialFormData);
             } else {
                 // API returned null successfully
                 setProfileData(null);
                 setFormData({});
             }
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
        setFetchError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Empty dependency array means run once on mount

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Handle select changes
  const handleSelectChange = (id: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value === 'null' ? null : value })); // Handle potential null value from selects
  };

  // Handle form submission (saving changes)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    // Prepare data for API
    const dataToSend = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || null, // Send null if empty string
        // Ensure potentially null fields are sent as null if empty
        title: formData.title || null,
        middleName: formData.middleName || null,
        gender: formData.gender || null,
        maritalStatus: formData.maritalStatus || null,
        typeOfMarriage: formData.typeOfMarriage || null,
        placeOfMarriage: formData.placeOfMarriage || null,
        marriageNumber: formData.marriageNumber || null,
        marriedTo: formData.marriedTo || null,
        address: formData.address || null,
        phoneCellNumber: formData.phoneCellNumber || null,
        sectionName: formData.sectionName || null,
        placeOfBaptism: formData.placeOfBaptism || null,
        baptismNumber: formData.baptismNumber || null,
        occupation: formData.occupation || null,
        skills: formData.skills || null,
        profession: formData.profession || null,
        churchSupportCard: formData.churchSupportCard || null,
        anyOtherComments: formData.anyOtherComments || null,
    };
    // Remove email from dataToSend as it shouldn't be updated here
    delete (dataToSend as any).email; 

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile");
      }

      // Update local profile data with saved data
      setProfileData(result);
      // Re-initialize formData to reflect saved state (especially date formatting)
      setFormData({
          ...formData, // Keep current form state visually until edit mode is exited? No, update fully.
          title: result.title ?? '',
          firstName: result.firstName ?? '',
          middleName: result.middleName ?? '',
          surname: result.surname ?? '',
          gender: result.gender ?? '',
          dateOfBirth: result.dateOfBirth ? new Date(result.dateOfBirth).toISOString().split('T')[0] : '',
          maritalStatus: result.maritalStatus ?? '',
          address: result.address ?? '',
          phoneCellNumber: result.phoneCellNumber ?? '',
          // email: result.email ?? '', // email doesn't change here
          placeOfBaptism: result.placeOfBaptism ?? '',
          baptismNumber: result.baptismNumber ?? '',
          typeOfMarriage: result.typeOfMarriage ?? '',
          placeOfMarriage: result.placeOfMarriage ?? '',
          marriageNumber: result.marriageNumber ?? '',
          marriedTo: result.marriedTo ?? '',
          sectionName: result.sectionName ?? '',
          churchSupportCard: result.churchSupportCard ?? '',
          occupation: result.occupation ?? '',
          skills: result.skills ?? '',
          profession: result.profession ?? '',
          anyOtherComments: result.anyOtherComments ?? '',
      });
      setSaveSuccess("Profile updated successfully!");
      setIsEditing(false); // Exit edit mode on success
      setTimeout(() => setSaveSuccess(null), 3000); // Clear success message after 3s

    } catch (error) {
      console.error("Save profile error:", error);
      setSaveError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancelling edit mode
  const handleCancel = () => {
    // Reset form data to original profile data (or empty if no profileData)
     const originalFormData = {
        title: profileData?.title ?? '',
        firstName: profileData?.firstName ?? '',
        middleName: profileData?.middleName ?? '',
        surname: profileData?.surname ?? '',
        gender: profileData?.gender ?? '',
        dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        maritalStatus: profileData?.maritalStatus ?? '',
        address: profileData?.address ?? '',
        phoneCellNumber: profileData?.phoneCellNumber ?? '',
        email: profileData?.email ?? '',
        placeOfBaptism: profileData?.placeOfBaptism ?? '',
        baptismNumber: profileData?.baptismNumber ?? '',
        typeOfMarriage: profileData?.typeOfMarriage ?? '',
        placeOfMarriage: profileData?.placeOfMarriage ?? '',
        marriageNumber: profileData?.marriageNumber ?? '',
        marriedTo: profileData?.marriedTo ?? '',
        sectionName: profileData?.sectionName ?? '',
        churchSupportCard: profileData?.churchSupportCard ?? '',
        occupation: profileData?.occupation ?? '',
        skills: profileData?.skills ?? '',
        profession: profileData?.profession ?? '',
        anyOtherComments: profileData?.anyOtherComments ?? '',
      };
    setFormData(originalFormData);
    setIsEditing(false);
    setSaveError(null); // Clear any previous save errors
    setSaveSuccess(null);
  };


  if (isLoading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (fetchError) {
     return (
        <div className="p-6 space-y-4">
             <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Fetching Profile</AlertTitle>
                <AlertDescription>{fetchError}</AlertDescription>
             </Alert>
        </div>
     );
  }

  // Note: profileData might be null if user has no census record yet.
  // formData is initialized based on profileData or empty object.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        {/* Toggle Edit/Cancel */}
        <Button onClick={isEditing ? handleCancel : () => setIsEditing(true)}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

       {/* Display Save Success/Error Messages */}
       {saveSuccess && (
         <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
           <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
           <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
           <AlertDescription className="text-green-700 dark:text-green-400">{saveSuccess}</AlertDescription>
         </Alert>
       )}
       {saveError && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Save Error</AlertTitle>
           <AlertDescription>{saveError}</AlertDescription>
         </Alert>
       )}

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="church">Church Information</TabsTrigger>
          <TabsTrigger value="guild" disabled>Guild Membership</TabsTrigger> {/* Disabled for now */}
        </TabsList>

        {/* Wrap content in a single form for submission */}
        <form onSubmit={handleSubmit}>
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Personal Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Select
                      disabled={!isEditing}
                      value={formData.title ?? ''}
                      onValueChange={(value) => handleSelectChange('title', value)}
                    >
                      <SelectTrigger id="title">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr.</SelectItem>
                        <SelectItem value="Mrs">Mrs.</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Dr">Dr.</SelectItem>
                        <SelectItem value="Rev">Rev.</SelectItem>
                        {/* Add other relevant titles */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surname">Surname</Label>
                    <Input
                      id="surname"
                      value={formData.surname ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      disabled={!isEditing}
                      value={formData.gender ?? ''}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      disabled={!isEditing}
                      value={formData.maritalStatus ?? ''}
                      onValueChange={(value) => handleSelectChange('maritalStatus', value)}
                    >
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {/* Email should generally not be editable here */}
                    <Input
                      id="email"
                      type="email"
                      value={formData.email ?? ''}
                      readOnly // Make email read-only
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneCellNumber">Phone Number</Label>
                    <Input
                      id="phoneCellNumber"
                      value={formData.phoneCellNumber ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address ?? ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      value={formData.profession ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Input
                      id="skills"
                      value={formData.skills ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="anyOtherComments">Other Comments</Label>
                     <Textarea // Changed to Textarea
                      id="anyOtherComments"
                      value={formData.anyOtherComments ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Any other relevant comments..."
                    />
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="church">
            <Card>
              <CardHeader>
                <CardTitle>Church Information</CardTitle>
                <CardDescription>Your sacramental and church-related information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {/* Church Info Fields */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBaptism">Place of Baptism</Label>
                      <Input
                        id="placeOfBaptism"
                        value={formData.placeOfBaptism ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baptismNumber">Baptism Number</Label>
                      <Input
                        id="baptismNumber"
                        value={formData.baptismNumber ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="typeOfMarriage">Type of Marriage</Label>
                      <Select
                        disabled={!isEditing}
                        value={formData.typeOfMarriage ?? ''}
                        onValueChange={(value) => handleSelectChange('typeOfMarriage', value)}
                      >
                        <SelectTrigger id="typeOfMarriage">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Catholic">Catholic</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                          <SelectItem value="Civil">Civil</SelectItem>
                          <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeOfMarriage">Place of Marriage</Label>
                      <Input
                        id="placeOfMarriage"
                        value={formData.placeOfMarriage ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marriageNumber">Marriage Number</Label>
                      <Input
                        id="marriageNumber"
                        value={formData.marriageNumber ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marriedTo">Married To</Label>
                      <Input
                        id="marriedTo"
                        value={formData.marriedTo ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sectionName">Parish Section</Label>
                      <Input
                        id="sectionName"
                        value={formData.sectionName ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="churchSupportCard">Church Support Card</Label>
                      <Input
                        id="churchSupportCard"
                        value={formData.churchSupportCard ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guild">
            <Card>
              <CardHeader>
                <CardTitle>Guild Membership</CardTitle>
                <CardDescription>Manage your guild affiliations (View Only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Guild Information</AlertTitle>
                  <AlertDescription>
                    Guild membership details are managed separately. Contact administration for changes.
                  </AlertDescription>
                </Alert>

                {/* Display Guild Info - Needs separate data fetching */}
                <div className="space-y-2">
                  <Label htmlFor="currentGuild">Current Guild</Label>
                  <Input id="currentGuild" value={profileData?.groupsGuild ?? 'N/A'} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Date Joined</Label>
                  {/* Needs data from UserGuild model */}
                  <Input id="joinDate" type="date" value={'N/A'} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guildRole">Role in Guild</Label>
                   {/* Needs data from UserGuild model */}
                  <Input id="guildRole" value={'N/A'} readOnly disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Common Save Button */}
          {isEditing && (
             <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
             </div>
           )}
        </form>
      </Tabs>
    </div>
  )
}
