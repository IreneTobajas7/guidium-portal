'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface ReportData {
  totalEmployees: number;
  activeOnboarding: number;
  completedOnboarding: number;
  averageCompletionTime: number;
  teamPerformance: {
    team: string;
    completionRate: number;
    averageTime: number;
  }[];
}

export default function ManagerReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    // Simulate fetching report data
    const fetchReportData = async () => {
      setLoading(true);
      // Mock data for now
      const mockData: ReportData = {
        totalEmployees: 24,
        activeOnboarding: 8,
        completedOnboarding: 16,
        averageCompletionTime: 12.5,
        teamPerformance: [
          { team: 'Engineering', completionRate: 85, averageTime: 10.2 },
          { team: 'Sales', completionRate: 92, averageTime: 8.5 },
          { team: 'Marketing', completionRate: 78, averageTime: 14.1 },
          { team: 'HR', completionRate: 95, averageTime: 7.8 }
        ]
      };
      
      setTimeout(() => {
        setReportData(mockData);
        setLoading(false);
      }, 1000);
    };

    fetchReportData();
  }, []);

  const handleExportReport = () => {
    // Handle report export functionality
    console.log('Exporting report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No report data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Reports</h1>
          <p className="text-gray-600 mt-2">Monitor your team&apos;s onboarding progress and performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
          <Button onClick={handleExportReport} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalEmployees}</p>
                <p className="text-sm text-gray-500">Active team members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.activeOnboarding}</p>
                <p className="text-sm text-gray-500">Currently onboarding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.completedOnboarding}</p>
                <p className="text-sm text-gray-500">Successfully onboarded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData.averageCompletionTime}</p>
                <p className="text-sm text-gray-500">Days to complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Completion Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Average Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.teamPerformance.map((team, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{team.team}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${team.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{team.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{team.averageTime} days</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        team.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                        team.completionRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {team.completionRate >= 90 ? 'Excellent' :
                         team.completionRate >= 75 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 