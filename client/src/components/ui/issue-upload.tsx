import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Bot, MapPin, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { UploadResult } from '@uppy/core';

interface AIAnalysisResult {
  issueType: string;
  confidence: number;
  priority: string;
  description: string;
  estimatedSize?: string;
  estimatedCost?: number;
  estimatedDuration?: number;
  recommendations?: string[];
}

export default function IssueUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [issueData, setIssueData] = useState({
    title: "",
    description: "",
    issueType: "",
    priority: "medium",
    address: "",
    latitude: "",
    longitude: "",
    imageUrl: "",
    isAnonymous: false,
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const createIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/issues", data);
    },
    onSuccess: () => {
      toast({
        title: "Issue Reported Successfully",
        description: "Your civic issue has been reported and will be reviewed by the appropriate department.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      // Reset form
      setIssueData({
        title: "",
        description: "",
        issueType: "",
        priority: "medium",
        address: "",
        latitude: "",
        longitude: "",
        imageUrl: "",
        isAnonymous: false,
      });
      setAiAnalysis(null);
      setUploadComplete(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to report issue: " + error.message,
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return { method: "PUT" as const, url: "" };
      }
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      
      setIssueData(prev => ({ ...prev, imageUrl }));
      setUploadComplete(true);
      
      // Trigger AI analysis
      setIsAnalyzing(true);
      try {
        // Convert uploaded image to base64 for AI analysis
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onload = async () => {
          const base64 = (reader.result as string);
          
          try {
            const analysisResponse = await apiRequest("POST", "/api/ai/analyze-image", {
              imageBase64: base64,
              location: issueData.address,
            });
            const analysisData = await analysisResponse.json();
            
            setAiAnalysis(analysisData);
            setIssueData(prev => ({
              ...prev,
              issueType: analysisData.issueType,
              priority: analysisData.priority,
              description: analysisData.description,
              title: prev.title || `${analysisData.issueType.replace('_', ' ')} issue detected`,
            }));
            
            toast({
              title: "AI Analysis Complete",
              description: `Issue detected: ${analysisData.issueType} with ${analysisData.confidence}% confidence`,
            });
          } catch (aiError) {
            console.error("AI analysis failed:", aiError);
            toast({
              title: "AI Analysis Failed",
              description: "Could not analyze image, but you can still submit the report manually.",
              variant: "destructive",
            });
          }
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to process uploaded image:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIssueData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast({
            title: "Location Retrieved",
            description: "Your current location has been added to the report.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not retrieve your location. Please enter the address manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!issueData.title.trim() || !issueData.description.trim() || !issueData.issueType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createIssueMutation.mutate(issueData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground" data-testid="text-upload-title">
          Report a Civic Issue
        </h2>
        <p className="text-muted-foreground">Upload a photo or video to get AI-powered assistance</p>
      </div>
      
      {/* Upload Section */}
      <Card data-testid="card-file-upload">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Photo or Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary hover:bg-primary/5 transition-all duration-200 pointer-events-none">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Drop your files here</h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse • Max 10MB • JPG, PNG, MP4
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {(isAnalyzing || aiAnalysis) && (
        <Card data-testid="card-ai-analysis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Analyzing image with AI...</p>
                </div>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Issue Type</span>
                      <span className="text-sm text-muted-foreground">{aiAnalysis.confidence}% confidence</span>
                    </div>
                    <Badge variant="secondary" className="text-sm" data-testid="badge-detected-type">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {aiAnalysis.issueType.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Priority Level</span>
                      <span className="text-sm text-muted-foreground capitalize">{aiAnalysis.priority}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          aiAnalysis.priority === 'urgent' ? 'bg-red-500' :
                          aiAnalysis.priority === 'high' ? 'bg-orange-500' :
                          aiAnalysis.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${
                            aiAnalysis.priority === 'urgent' ? 100 :
                            aiAnalysis.priority === 'high' ? 75 :
                            aiAnalysis.priority === 'medium' ? 50 : 25
                          }%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        AI Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Issue Details Form */}
      <Card data-testid="card-issue-form">
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <p className="text-sm text-muted-foreground">Provide additional information about the issue</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                value={issueData.title}
                onChange={(e) => setIssueData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                data-testid="input-issue-title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Issue Type *</label>
              <Select value={issueData.issueType} onValueChange={(value) => setIssueData(prev => ({ ...prev, issueType: value }))}>
                <SelectTrigger data-testid="select-issue-type">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="graffiti">Graffiti</SelectItem>
                  <SelectItem value="streetlight">Street Light</SelectItem>
                  <SelectItem value="trash_overflow">Trash Overflow</SelectItem>
                  <SelectItem value="sidewalk_damage">Sidewalk Damage</SelectItem>
                  <SelectItem value="traffic_sign">Traffic Sign</SelectItem>
                  <SelectItem value="water_leak">Water Leak</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description *</label>
            <Textarea
              value={issueData.description}
              onChange={(e) => setIssueData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the issue, including size, severity, and safety impact"
              rows={4}
              data-testid="textarea-issue-description"
            />
          </div>

          {/* Priority and Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select value={issueData.priority} onValueChange={(value) => setIssueData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger data-testid="select-issue-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={issueData.isAnonymous}
                  onChange={(e) => setIssueData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-primary"
                  data-testid="checkbox-anonymous"
                />
                <label htmlFor="anonymous" className="text-sm font-medium text-foreground">
                  Report anonymously
                </label>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <div className="flex gap-2">
              <Input
                value={issueData.address}
                onChange={(e) => setIssueData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address or intersection"
                className="flex-1"
                data-testid="input-issue-address"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                className="gap-2"
                data-testid="button-get-location"
              >
                <MapPin className="h-4 w-4" />
                Use Current Location
              </Button>
            </div>
          </div>

          {/* Actions */}
          <Separator />
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setIssueData({
                  title: "",
                  description: "",
                  issueType: "",
                  priority: "medium",
                  address: "",
                  latitude: "",
                  longitude: "",
                  imageUrl: "",
                  isAnonymous: false,
                });
                setAiAnalysis(null);
                setUploadComplete(false);
              }}
              data-testid="button-clear-form"
            >
              Clear Form
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createIssueMutation.isPending || !uploadComplete}
              className="gap-2"
              data-testid="button-submit-report"
            >
              {createIssueMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}