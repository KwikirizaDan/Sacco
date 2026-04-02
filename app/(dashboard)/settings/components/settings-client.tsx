"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { GeneralTab } from "./general-tab"
import { InterestRatesTab } from "./interest-rates-tab"
import { LoanCategoriesTab } from "./loan-categories-tab"
import { SavingsCategoriesTab } from "./savings-categories-tab"
import { FineCategoriesTab } from "./fine-categories-tab"
import { PaymentsTab } from "./payments-tab"
import {
  Building2,
  Percent,
  Banknote,
  PiggyBank,
  AlertCircle,
  CreditCard,
  Settings,
  Globe,
  Shield,
  Bell,
  Mail,
  Database,
  Layout,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsClientProps {
  sacco: any
  interestRates: any[]
  loanCategories: any[]
  savingsCategories: any[]
  fineCategories: any[]
}

// Tab configuration with icons and descriptions
const tabs = [
  { 
    id: "general", 
    label: "General", 
    icon: Building2, 
    color: "text-blue-500",
    description: "SACCO profile and branding"
  },
  { 
    id: "interest", 
    label: "Interest Rates", 
    icon: Percent, 
    color: "text-green-500",
    description: "Loan interest rate tiers"
  },
  { 
    id: "loans", 
    label: "Loan Categories", 
    icon: Banknote, 
    color: "text-purple-500",
    description: "Loan types and terms"
  },
  { 
    id: "savings", 
    label: "Savings Categories", 
    icon: PiggyBank, 
    color: "text-emerald-500",
    description: "Savings account types"
  },
  { 
    id: "fines", 
    label: "Fine Categories", 
    icon: AlertCircle, 
    color: "text-red-500",
    description: "Penalty categories"
  },
  { 
    id: "payments", 
    label: "Payments & SMS", 
    icon: CreditCard, 
    color: "text-orange-500",
    description: "Payment gateways & SMS"
  },
]

export function SettingsClient({
  sacco,
  interestRates,
  loanCategories,
  savingsCategories,
  fineCategories,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your SACCO platform settings and preferences
        </p>
      </div>

      {/* Layout with Vertical Tabs */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Vertical Tabs Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-6">
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">Settings Menu</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage your SACCO configuration
                </p>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <nav className="flex flex-col p-2 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    
                    // Get count for badge based on tab id
                    let badgeCount = 0
                    if (tab.id === "interest") badgeCount = interestRates?.length || 0
                    if (tab.id === "loans") badgeCount = loanCategories?.length || 0
                    if (tab.id === "savings") badgeCount = savingsCategories?.length || 0
                    if (tab.id === "fines") badgeCount = fineCategories?.length || 0
                    
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
                <p className="text-xs text-muted-foreground text-center">
                  Changes take effect immediately
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">General Settings</h2>
              </div>
              <GeneralTab sacco={sacco} />
            </div>
          )}

          {/* Interest Rates Tab */}
          {activeTab === "interest" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold">Interest Rates</h2>
                <Badge variant="outline" className="ml-2">
                  {interestRates?.length || 0} tiers
                </Badge>
              </div>
              <InterestRatesTab rates={interestRates} />
            </div>
          )}

          {/* Loan Categories Tab */}
          {activeTab === "loans" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold">Loan Categories</h2>
                <Badge variant="outline" className="ml-2">
                  {loanCategories?.length || 0} categories
                </Badge>
              </div>
              <LoanCategoriesTab categories={loanCategories} />
            </div>
          )}

          {/* Savings Categories Tab */}
          {activeTab === "savings" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold">Savings Categories</h2>
                <Badge variant="outline" className="ml-2">
                  {savingsCategories?.length || 0} categories
                </Badge>
              </div>
              <SavingsCategoriesTab categories={savingsCategories} />
            </div>
          )}

          {/* Fine Categories Tab */}
          {activeTab === "fines" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold">Fine Categories</h2>
                <Badge variant="outline" className="ml-2">
                  {fineCategories?.length || 0} categories
                </Badge>
              </div>
              <FineCategoriesTab categories={fineCategories} />
            </div>
          )}

          {/* Payments & SMS Tab */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Payments & SMS</h2>
              </div>
              <PaymentsTab sacco={sacco} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}