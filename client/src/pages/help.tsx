import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function HelpPage() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    toast({
      title: "Message sent",
      description: "We've received your message and will respond within 24 hours.",
    });
    setContactForm({ name: "", email: "", subject: "", category: "", message: "" });
  };

  const faqData = [
    {
      question: "How do I report a civic issue?",
      answer: "To report an issue, click the 'Report Issue' button on the home page, take or upload a photo, add a description and location details, and submit. Our AI will automatically classify the issue and route it to the appropriate department."
    },
    {
      question: "How long does it take for issues to be resolved?",
      answer: "Resolution times vary by issue type and priority. Urgent safety issues are typically addressed within 24-48 hours, while routine maintenance may take 1-2 weeks. You can track progress on your report's detail page."
    },
    {
      question: "Can I report issues anonymously?",
      answer: "Yes, you can choose to make your profile anonymous in your privacy settings. However, providing contact information helps officials follow up with additional questions if needed."
    },
    {
      question: "What types of issues can I report?",
      answer: "You can report potholes, graffiti, broken streetlights, trash overflow, sidewalk damage, traffic sign issues, water leaks, and other civic infrastructure problems. Use 'Other' for issues that don't fit standard categories."
    },
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI achieves 85-95% accuracy in identifying common civic issues. You can always edit the AI's suggestions before submitting your report. The system learns from corrections to improve over time."
    },
    {
      question: "Can I edit or delete my reports?",
      answer: "You can edit reports within 24 hours of submission. After that, only officials can update status. You cannot delete reports once they're submitted, but you can request removal by contacting support."
    },
    {
      question: "How do I become an official user?",
      answer: "Official accounts are for government employees only. You must register with an official government email address (@gov, @city, @county, etc.) and verify your employment. Contact your IT department for assistance."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use enterprise-grade security and follow government privacy standards. Your data is encrypted and only shared with relevant officials for issue resolution. See our Privacy Policy for details."
    }
  ];

  const quickActions = [
    { icon: "fas fa-plus", title: "Report New Issue", description: "Submit a new civic issue report", link: "/report" },
    { icon: "fas fa-list", title: "View My Reports", description: "Check status of your submitted reports", link: "/reports" },
    { icon: "fas fa-users", title: "Community Forum", description: "Join discussions with other citizens", link: "/community" },
    { icon: "fas fa-user-cog", title: "Account Settings", description: "Manage your profile and preferences", link: "/profile" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-help-title">
            Help & Support
          </h1>
          <p className="text-gray-600 mt-2">
            Get help using CivicLens and find answers to common questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-bolt mr-2 text-yellow-500"></i>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => window.location.href = action.link}
                    data-testid={`button-quick-action-${index}`}
                  >
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <i className={`${action.icon} mr-2 text-blue-500`}></i>
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="mt-6" data-testid="card-system-status">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-heartbeat mr-2 text-green-500"></i>
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platform Status</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Analysis</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Upload</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ */}
            <Card data-testid="card-faq">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-question-circle mr-2 text-blue-500"></i>
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger 
                        className="text-left hover:no-underline"
                        data-testid={`faq-question-${index}`}
                      >
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent 
                        className="text-gray-600 pb-4"
                        data-testid={`faq-answer-${index}`}
                      >
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card data-testid="card-contact-form">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-envelope mr-2 text-purple-500"></i>
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={contactForm.category}
                        onValueChange={(value) => setContactForm({...contactForm, category: value})}
                      >
                        <SelectTrigger data-testid="select-contact-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="account">Account Problem</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="general">General Question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        required
                        data-testid="input-contact-subject"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      rows={6}
                      required
                      data-testid="textarea-contact-message"
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto" data-testid="button-send-message">
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}