"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Edit, Trash2, Users, FileText } from "lucide-react"

export default function GuildsPage() {
  const [showAddGuildDialog, setShowAddGuildDialog] = useState(false)
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false)

  const guilds = [
    { id: 1, name: "St. Mary's Guild", description: "Women's guild focused on charitable works", memberCount: 45 },
    { id: 2, name: "St. Joseph's Guild", description: "Men's guild focused on parish maintenance", memberCount: 32 },
    { id: 3, name: "St. Cecilia's Guild", description: "Music ministry and choir", memberCount: 18 },
    { id: 4, name: "St. Vincent de Paul Guild", description: "Outreach to the poor and needy", memberCount: 27 },
  ]

  const fees = [
    { id: 1, guildId: 1, description: "Annual Membership", amount: 50.0, frequency: "Yearly" },
    { id: 2, guildId: 1, description: "Special Projects", amount: 25.0, frequency: "As needed" },
    { id: 3, guildId: 2, description: "Annual Membership", amount: 50.0, frequency: "Yearly" },
    { id: 4, guildId: 3, description: "Annual Membership", amount: 40.0, frequency: "Yearly" },
    { id: 5, guildId: 4, description: "Annual Membership", amount: 45.0, frequency: "Yearly" },
    { id: 6, guildId: 4, description: "Outreach Fund", amount: 30.0, frequency: "Quarterly" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Guild Management</h2>
        <Button onClick={() => setShowAddGuildDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Guild
        </Button>
      </div>

      <Tabs defaultValue="guilds">
        <TabsList>
          <TabsTrigger value="guilds">Guilds</TabsTrigger>
          <TabsTrigger value="fees">Guild Fees</TabsTrigger>
          <TabsTrigger value="documents">Guild Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="guilds" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {guilds.map((guild) => (
              <Card key={guild.id}>
                <CardHeader>
                  <CardTitle>{guild.name}</CardTitle>
                  <CardDescription>{guild.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{guild.memberCount} members</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    View Members
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guild Fees</CardTitle>
                <CardDescription>Manage membership and other fees for each guild</CardDescription>
              </div>
              <Button onClick={() => setShowAddFeeDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Fee
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guild</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{guilds.find((g) => g.id === fee.guildId)?.name}</TableCell>
                      <TableCell>{fee.description}</TableCell>
                      <TableCell>${fee.amount.toFixed(2)}</TableCell>
                      <TableCell>{fee.frequency}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guild Documents</CardTitle>
                <CardDescription>Manage documents for each guild</CardDescription>
              </div>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guild</TableHead>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>St. Mary's Guild</TableCell>
                    <TableCell>Constitution</TableCell>
                    <TableCell>PDF</TableCell>
                    <TableCell>Jan 15, 2024</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* More document rows would go here */}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddGuildDialog} onOpenChange={setShowAddGuildDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Guild</DialogTitle>
            <DialogDescription>Create a new guild for parish members to join.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guild-name">Guild Name</Label>
              <Input id="guild-name" placeholder="e.g., St. Patrick's Guild" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guild-description">Description</Label>
              <Textarea id="guild-description" placeholder="Describe the purpose and activities of this guild" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGuildDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddGuildDialog(false)}>Create Guild</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Fee</DialogTitle>
            <DialogDescription>Create a new fee for a guild.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee-guild">Guild</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Select a guild</option>
                {guilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-description">Description</Label>
              <Input id="fee-description" placeholder="e.g., Annual Membership" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-amount">Amount ($)</Label>
              <Input id="fee-amount" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-frequency">Frequency</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Select frequency</option>
                <option value="One-time">One-time</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
                <option value="As needed">As needed</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFeeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddFeeDialog(false)}>Add Fee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
