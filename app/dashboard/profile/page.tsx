"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <Button onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit Profile"}</Button>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="church">Church Information</TabsTrigger>
          <TabsTrigger value="guild">Guild Membership</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Select disabled={!isEditing} defaultValue="mr">
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Mr.</SelectItem>
                      <SelectItem value="mrs">Mrs.</SelectItem>
                      <SelectItem value="miss">Miss</SelectItem>
                      <SelectItem value="dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" defaultValue="" readOnly={!isEditing} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input id="surname" defaultValue="Doe" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select disabled={!isEditing} defaultValue="male">
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" defaultValue="1980-01-01" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select disabled={!isEditing} defaultValue="single">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1234567890" readOnly={!isEditing} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Main St, City" readOnly={!isEditing} />
              </div>
            </CardContent>
            <CardFooter>{isEditing && <Button className="w-full">Save Changes</Button>}</CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="church">
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
              <CardDescription>Your sacramental and church-related information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placeOfBaptism">Place of Baptism</Label>
                  <Input id="placeOfBaptism" defaultValue="St. Mary's Church" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baptismNumber">Baptism Number</Label>
                  <Input id="baptismNumber" defaultValue="B12345" readOnly={!isEditing} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeOfMarriage">Type of Marriage</Label>
                  <Select disabled={!isEditing} defaultValue="catholic">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catholic">Catholic</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="civil">Civil</SelectItem>
                      <SelectItem value="na">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfMarriage">Place of Marriage</Label>
                  <Input id="placeOfMarriage" defaultValue="St. Agnes Cathedral" readOnly={!isEditing} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marriageNumber">Marriage Number</Label>
                  <Input id="marriageNumber" defaultValue="M7890" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marriedTo">Married To</Label>
                  <Input id="marriedTo" defaultValue="Jane Doe" readOnly={!isEditing} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sectionName">Parish Section</Label>
                  <Input id="sectionName" defaultValue="North Section" readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churchSupportCard">Church Support Card</Label>
                  <Input id="churchSupportCard" defaultValue="CS54321" readOnly={!isEditing} />
                </div>
              </div>
            </CardContent>
            <CardFooter>{isEditing && <Button className="w-full">Save Changes</Button>}</CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="guild">
          <Card>
            <CardHeader>
              <CardTitle>Guild Membership</CardTitle>
              <CardDescription>Manage your guild affiliations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Guild Selection</AlertTitle>
                <AlertDescription>
                  You can only be a member of one guild at a time. Changing your guild will require approval.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="currentGuild">Current Guild</Label>
                <Select disabled={!isEditing} defaultValue="mary">
                  <SelectTrigger>
                    <SelectValue placeholder="Select guild" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mary">St. Mary's Guild</SelectItem>
                    <SelectItem value="joseph">St. Joseph's Guild</SelectItem>
                    <SelectItem value="cecilia">St. Cecilia's Guild</SelectItem>
                    <SelectItem value="vincent">St. Vincent de Paul Guild</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinDate">Date Joined</Label>
                <Input id="joinDate" type="date" defaultValue="2023-01-15" readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guildRole">Role in Guild</Label>
                <Input id="guildRole" defaultValue="Member" readOnly />
              </div>
            </CardContent>
            <CardFooter>{isEditing && <Button className="w-full">Save Changes</Button>}</CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
