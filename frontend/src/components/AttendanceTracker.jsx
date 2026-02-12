import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeAPI, attendanceAPI } from '../api/client';

const AttendanceTracker = () => {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeSearchText, setEmployeeSearchText] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Present');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Fetch employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeAPI.getAll,
  });
  
  // Fetch attendance for selected employee with optional filters
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['attendance', selectedEmployeeId, filterStartDate, filterEndDate],
    queryFn: () => attendanceAPI.getByEmployee(selectedEmployeeId, filterStartDate || null, filterEndDate || null),
    enabled: !!selectedEmployeeId,
  });
  
  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: attendanceAPI.mark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setSuccessMessage('Attendance marked successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.detail || error.message;
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });
  
  const handleClearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
  };
  
  // Calculate present days count
  const presentDaysCount = attendanceRecords?.filter(record => record.status === 'Present').length || 0;
  const totalRecords = attendanceRecords?.length || 0;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setErrorMessage('Please select an employee');
      return;
    }
    
    const dateTime = new Date(attendanceDate + 'T09:00:00').toISOString();
    
    markAttendanceMutation.mutate({
      employee_id: parseInt(selectedEmployeeId),
      date: dateTime,
      status: status,
    });
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mark Attendance</h2>
        
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
              Search Employee
            </label>
            <input
              type="text"
              id="employee"
              value={employeeSearchText}
              onChange={(e) => {
                setEmployeeSearchText(e.target.value);
                setShowEmployeeDropdown(true);
                if (e.target.value === '') {
                  setSelectedEmployeeId('');
                }
              }}
              onFocus={() => setShowEmployeeDropdown(true)}
              onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
              placeholder="Type to search employee..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {showEmployeeDropdown && employees && employees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {employees
                  .filter(emp => 
                    emp.full_name.toLowerCase().includes(employeeSearchText.toLowerCase()) ||
                    emp.department.toLowerCase().includes(employeeSearchText.toLowerCase())
                  )
                  .map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => {
                        setSelectedEmployeeId(employee.id.toString());
                        setEmployeeSearchText(`${employee.full_name} (${employee.department})`);
                        setShowEmployeeDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{employee.full_name}</div>
                      <div className="text-sm text-gray-500">{employee.department}</div>
                    </div>
                  ))}
                {employees.filter(emp => 
                  emp.full_name.toLowerCase().includes(employeeSearchText.toLowerCase()) ||
                  emp.department.toLowerCase().includes(employeeSearchText.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    No employees found
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="Present"
                  checked={status === 'Present'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Present</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="Absent"
                  checked={status === 'Absent'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Absent</span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={markAttendanceMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {markAttendanceMutation.isPending ? 'Marking...' : 'Mark Attendance'}
          </button>
        </form>
      </div>
      
      {selectedEmployeeId && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance History</h2>
          
          {/* Date Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter From
                </label>
                <input
                  type="date"
                  id="filterStartDate"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter To
                </label>
                <input
                  type="date"
                  id="filterEndDate"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Present Days Summary */}
          {!isLoading && attendanceRecords && attendanceRecords.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Present Days</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {presentDaysCount} <span className="text-sm font-normal text-blue-600">out of {totalRecords} records</span>
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : attendanceRecords && attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No attendance records found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
