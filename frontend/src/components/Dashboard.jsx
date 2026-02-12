import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/client';
import EmployeeListModal from './modals/EmployeeListModal';
import AttendanceListModal from './modals/AttendanceListModal';

const Dashboard = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedModal, setSelectedModal] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => dashboardAPI.getSummary(startDate || null, endDate || null),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const handleTileClick = (statId) => {
    setSelectedModal(statId);
  };

  const handleCloseModal = () => {
    setSelectedModal(null);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const stats = [
    {
      id: 'employees',
      title: 'Total Employees',
      value: data?.total_employees || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      clickable: true,
    },
    {
      id: 'attendance',
      title: 'Total Attendance Records',
      value: data?.total_attendance_records || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      clickable: false,
    },
    {
      id: 'present',
      title: 'Present Days',
      value: data?.present_count || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgLight: 'bg-teal-50',
      clickable: true,
    },
    {
      id: 'absent',
      title: 'Absent Days',
      value: data?.absent_count || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
      clickable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        </div>

        {/* Date Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            )}
          </div>
          {(startDate || endDate) && (
            <p className="mt-2 text-sm text-gray-600">
              Showing data {startDate && `from ${new Date(startDate).toLocaleDateString()}`} {endDate && `to ${new Date(endDate).toLocaleDateString()}`}
            </p>
          )}
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.id}
              onClick={() => stat.clickable && handleTileClick(stat.id)}
              className={`bg-white border border-gray-200 rounded-lg shadow-sm transition-all ${
                stat.clickable 
                  ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:border-blue-300' 
                  : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgLight} p-3 rounded-lg`}>
                    <div className={stat.textColor}>
                      {stat.icon}
                    </div>
                  </div>
                  {stat.clickable && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.clickable && (
                    <p className="text-xs text-blue-600 mt-2">Click to view details</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance Rate Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100 mb-1">Overall Attendance Rate</p>
              <p className="text-4xl font-bold">{data?.attendance_rate || 0}%</p>
              <p className="text-sm text-blue-100 mt-2">
                Based on {data?.total_attendance_records || 0} total records
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Summary Text */}
        {data && data.total_employees === 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              No employees in the system yet. Add employees to start tracking attendance.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <EmployeeListModal
        isOpen={selectedModal === 'employees'}
        onClose={handleCloseModal}
        startDate={startDate || null}
        endDate={endDate || null}
      />
      <AttendanceListModal
        isOpen={selectedModal === 'present'}
        onClose={handleCloseModal}
        status="Present"
        startDate={startDate || null}
        endDate={endDate || null}
      />
      <AttendanceListModal
        isOpen={selectedModal === 'absent'}
        onClose={handleCloseModal}
        status="Absent"
        startDate={startDate || null}
        endDate={endDate || null}
      />
    </div>
  );
};

export default Dashboard;
