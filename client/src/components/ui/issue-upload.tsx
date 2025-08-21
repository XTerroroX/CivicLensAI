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
import { apiRequest } from "@/lib/queryClient";
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
        title: "Issue Reported",
        description: "Your civic issue has been reported successfully and will be reviewed by the appropriate department.",
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
          const base64 = (reader.result as string).split(',')[1];
          
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

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "pothole": return "fas fa-road";
      case "graffiti": return "fas fa-paint-brush";
      case "streetlight": return "fas fa-lightbulb";
      case "trash_overflow": return "fas fa-trash";
      case "sidewalk_damage": return "fas fa-walking";
      case "traffic_sign": return "fas fa-sign";
      case "water_leak": return "fas fa-tint";
      default: return "fas fa-exclamation-triangle";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8" data-testid="text-upload-title">
        Report an Issue
      </h2>
      
      {/* Upload Section */}
      <Card className="mb-8" data-testid="card-file-upload">
        <CardContent className="pt-6">
          <div className="text-center">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary transition-colors">
                <div className="space-y-4">
                  <i className="fas fa-cloud-upload-alt text-6xl text-gray-400"></i>
                  <div>
                    <p className="text-xl font-medium text-gray-900">Drop your photo or video here</p>
                    <p className="text-gray-500">or click to browse files</p>
                  </div>
                </div>
              </div>
            </ObjectUploader>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {(isAnalyzing || aiAnalysis) && (
        <Card className="mb-8" data-testid="card-ai-analysis">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-robot text-primary mr-2"></i>
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <span className="text-gray-600">Analyzing image with AI...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Issue Type</span>
                      <span className="text-sm text-gray-500">{aiAnalysis.confidence}% confidence</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800" data-testid="badge-detected-type">
                      <i className={`${getIssueTypeIcon(aiAnalysis.issueType)} mr-1`}></i>
                      {aiAnalysis.issueType.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Priority</span>
                      <span className="text-sm text-gray-500">{aiAnalysis.priority}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
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
                      ></div>
                    </div>
                  </div>
                </div>

                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">AI Recommendations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {aiAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Issue Form */}
      <Card data-testid="card-issue-form">
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <Input
                value={issueData.title}
                onChange={(e) => setIssueData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                data-testid="input-issue-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type *</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <Textarea
              value={issueData.description}
              onChange={(e) => setIssueData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the issue, including size, severity, and safety impact"
              rows={4}
              data-testid="textarea-issue-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
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
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  data-testid="checkbox-anonymous"
                />
                <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">
                  Report anonymously
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="flex space-x-2">
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
                data-testid="button-get-location"
              >
                <i className="fas fa-map-marker-alt mr-2"></i>
                Use Current Location
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
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
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-submit-report"
            >
              {createIssueMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
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
