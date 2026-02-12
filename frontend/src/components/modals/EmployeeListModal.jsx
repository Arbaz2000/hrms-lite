import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../api/client';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';

const EmployeeListModal = ({ isOpen, onClose, startDate, endDate }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employeesWithAttendance', startDate, endDate],
    queryFn: () => dashboardAPI.getEmployeesWithAttendance(null, startDate, endDate),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleCloseAttendanceModal = () => {
    setSelectedEmployee(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">All Employees</h2>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-4 text-gray-600">No employees found</p>
              </div>
            )}

            {!isLoading && !error && employees && employees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEmployeeClick(employee)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {employee.full_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{employee.present_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{employee.absent_count}</td>
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

export default EmployeeListModal;
