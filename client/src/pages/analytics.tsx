import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Analytics() {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({
    department: "",
    dateFrom: "",
    dateTo: "",
  });

  const { data: issueStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/issue-stats", filters],
    enabled: !!user,
  });

  const { data: dashboardStats, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    enabled: !!user,
  });

  const getStatCard = (title: string, value: number | string, icon: string, color: string, change?: string) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-full`}>
            <i className={`${icon} text-xl`}></i>
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{change}</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-analytics-title">
              Analytics & Insights
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive data analysis of civic issues and community engagement
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-export-data">
              <i className="fas fa-download mr-2"></i>Export Data
            </Button>
            <Button variant="outline" size="sm" data-testid="button-share-report">
              <i className="fas fa-share mr-2"></i>Share Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6" data-testid="card-analytics-filters">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.department} onValueChange={(value) => setFilters({...filters, department: value})}>
                <SelectTrigger data-testid="select-department-filter">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="public_works">Public Works</SelectItem>
                  <SelectItem value="sanitation">Sanitation</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                placeholder="From date"
                data-testid="input-date-from"
              />

              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                placeholder="To date"
                data-testid="input-date-to"
              />

              <Button 
                variant="outline" 
                onClick={() => setFilters({ department: "all", dateFrom: "", dateTo: "" })}
                data-testid="button-clear-analytics-filters"
              >
                <i className="fas fa-times mr-2"></i>Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {getStatCard(
                "Total Reports",
                dashboardStats?.totalReports || 0,
                "fas fa-file-alt text-blue-600",
                "bg-blue-100",
                "+12%"
              )}
              {getStatCard(
                "In Progress",
                dashboardStats?.inProgress || 0,
                "fas fa-clock text-orange-600",
                "bg-orange-100",
                "3 urgent"
              )}
              {getStatCard(
                "Resolved",
                dashboardStats?.resolved || 0,
                "fas fa-check-circle text-green-600",
                "bg-green-100",
                "68% rate"
              )}
              {getStatCard(
                "Avg Response",
                `${dashboardStats?.avgResponseTime || 0} days`,
                "fas fa-stopwatch text-purple-600",
                "bg-purple-100",
                "faster"
              )}
            </>
          )}
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Issue Distribution */}
          <Card data-testid="card-issue-distribution">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-chart-pie mr-2 text-primary"></i>
                Issue Distribution by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              ) : issueStats?.byType ? (
                <div className="space-y-4">
                  {Object.entries(issueStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-primary rounded-full"></div>
                        <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{count}</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${(count / issueStats.total * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-pie text-4xl mb-4"></i>
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card data-testid="card-department-performance">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-chart-bar mr-2 text-secondary"></i>
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              ) : issueStats?.byDepartment ? (
                <div className="space-y-4">
                  {Object.entries(issueStats.byDepartment).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-secondary rounded-full"></div>
                        <span className="font-medium capitalize">{dept.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{count}</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-secondary rounded-full" 
                            style={{ width: `${(count / issueStats.total * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-bar text-4xl mb-4"></i>
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <Card data-testid="card-status-overview">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-tasks mr-2 text-primary"></i>
              Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center p-4 border rounded-lg animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-800 mb-1">
                    {issueStats?.pending || 0}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Pending</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {issueStats?.inProgress || 0}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">In Progress</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-800 mb-1">
                    {issueStats?.resolved || 0}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Resolved</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {issueStats?.total || 0}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heatmap Placeholder */}
        <Card className="mt-8" data-testid="card-heatmap">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-map mr-2 text-primary"></i>
              Geographic Distribution
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Heat map showing issue density across the city</p>
          </CardHeader>
          <CardContent>
            <div 
              className="h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className="absolute inset-0 bg-blue-900 bg-opacity-40"></div>
              <div className="relative z-10 text-center text-white">
                <i className="fas fa-map text-4xl mb-4"></i>
                <p className="text-lg font-medium">Interactive Map View</p>
                <p className="text-sm opacity-80">Click to explore issue clusters and trends</p>
              </div>
              
              {/* Sample heat markers */}
              <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-red-500 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
              <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-500 rounded-full opacity-80"></div>
              <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-orange-500 rounded-full opacity-80"></div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">High Priority Areas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Medium Priority</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Low Priority</span>
                </div>
              </div>
              <Button variant="outline" size="sm" data-testid="button-full-map">
                View Full Map →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
