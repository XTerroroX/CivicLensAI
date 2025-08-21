import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  stats?: {
    totalReports: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  };
  isLoading: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Reports",
      value: stats?.totalReports || 0,
      icon: "fas fa-file-alt",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12%",
      changeNote: "from last month",
      testId: "stat-total-reports"
    },
    {
      title: "In Progress",
      value: stats?.inProgress || 0,
      icon: "fas fa-clock",
      color: "bg-orange-100",
      iconColor: "text-orange-600",
      change: "3 urgent",
      changeNote: "need attention",
      testId: "stat-in-progress"
    },
    {
      title: "Resolved",
      value: stats?.resolved || 0,
      icon: "fas fa-check-circle",
      color: "bg-green-100",
      iconColor: "text-green-600",
      change: "68%",
      changeNote: "resolution rate",
      testId: "stat-resolved"
    },
    {
      title: "Avg Response",
      value: `${stats?.avgResponseTime || 0}`,
      icon: "fas fa-stopwatch",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "days",
      changeNote: "faster than city avg",
      testId: "stat-avg-response"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow" data-testid={stat.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{stat.change}</span>
              <span className="text-gray-500 ml-1">{stat.changeNote}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
