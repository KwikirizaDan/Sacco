"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, History, Bell, CheckCircle, XCircle, Clock, Megaphone, Archive } from "lucide-react"
import { SendNotificationForm } from "./send-notification-form"
import { NotificationsHistory } from "./notifications-history"
import { cn } from "@/lib/utils"

interface NotificationsClientProps {
  notifications: any[]
  members: any[]
}

// Tab configuration for vertical sidebar
const notificationTabs = [
  { 
    id: "send", 
    label: "Send Notification", 
    icon: Send, 
    color: "text-blue-500",
    description: "Create and send new notifications"
  },
  { 
    id: "history", 
    label: "History", 
    icon: History, 
    color: "text-purple-500",
    description: "View all sent notifications"
  },
]

export function NotificationsClient({
  notifications,
  members,
}: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState("send")
  
  const sentCount = notifications.filter((n) => n.status === "sent").length
  const failedCount = notifications.filter((n) => n.status === "failed").length
  const pendingCount = notifications.filter((n) => n.status === "pending").length

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send and manage member notifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Total Sent</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{sentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{failedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Layout with Vertical Tabs */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Vertical Tabs Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-6">
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">Notification Center</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage all communications
                </p>
              </div>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <nav className="flex flex-col p-2 space-y-1">
                  {notificationTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const badgeCount = tab.id === "history" ? notifications.length : 0
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-start gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 w-full text-left",
                          "hover:bg-muted hover:text-foreground",
                          isActive
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", tab.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{tab.label}</span>
                            {badgeCount > 0 && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {badgeCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {tab.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </ScrollArea>
              
              {/* Footer note */}
              <div className="p-3 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Archive className="h-3 w-3" />
                  Notifications are saved for 30 days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          
          {/* Send Notification Tab */}
          {activeTab === "send" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Send Notification</h2>
                <Badge variant="outline" className="ml-2">
                  Available members: {members.length}
                </Badge>
              </div>
              <SendNotificationForm members={members} />
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold">Notification History</h2>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {sentCount} Sent
                  </Badge>
                  <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    {failedCount} Failed
                  </Badge>
                  <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {pendingCount} Pending
                  </Badge>
                </div>
              </div>
              <NotificationsHistory notifications={notifications} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}