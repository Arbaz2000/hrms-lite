import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../api/client';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';

const AttendanceListModal = ({ isOpen, onClose, status, startDate, endDate }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employeesByStatus', status, startDate, endDate],
    queryFn: () => dashboardAPI.getEmployeesWithAttendance(status, startDate, endDate),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleCloseAttendanceModal = () => {
    setSelectedEmployee(null);
  };

  const statusColor = status === 'Present' ? 'green' : 'red';
  const statusIcon = status === 'Present' ? (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={`text-${statusColor}-600`}>
                {statusIcon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Employees with {status} Days
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">Error loading employees</p>
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            {!isLoading && !error && employees && employees.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-4 text-gray-600">No employees found with {status.toLowerCase()} days</p>
                <p className="text-sm text-gray-500 mt-2">
                  {startDate || endDate ? 'Try adjusting your date filters' : 'No attendance records match this status'}
                </p>
              </div>
            )}

            {!isLoading && !error && employees && employees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{status} Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEmployeeClick(employee)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {employee.full_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.department}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-${statusColor}-600`}>
                          {status === 'Present' ? employee.present_count : employee.absent_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.total_records}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedEmployee && (
        <EmployeeAttendanceModal
          isOpen={!!selectedEmployee}
          onClose={handleCloseAttendanceModal}
          employee={selectedEmployee}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </>
  );
};

export default AttendanceListModal;
