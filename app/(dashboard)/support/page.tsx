import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MessageSquare, HelpCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get help and support for using the SACCO management system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Reach out to our support team for assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">+254 XXX XXX XXX</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">support@sacco.com</span>
            </div>
            <Button className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Common questions and answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How do I add a new member?</h4>
              <p className="text-sm text-muted-foreground">
                Go to Members → Add Member and fill in the required details.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">
                How do I process a loan application?
              </h4>
              <p className="text-sm text-muted-foreground">
                Navigate to Loans → New Loan and complete the application form.
              </p>
            </div>
            <Button variant="outline" className="w-full">
              View All FAQs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
