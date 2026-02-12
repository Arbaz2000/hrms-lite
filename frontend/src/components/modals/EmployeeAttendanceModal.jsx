import { useQuery } from '@tanstack/react-query';
import { attendanceAPI } from '../../api/client';

const EmployeeAttendanceModal = ({ isOpen, onClose, employee, startDate, endDate }) => {
  const { data: attendanceRecords, isLoading, error } = useQuery({
    queryKey: ['employeeAttendance', employee.id, startDate, endDate],
    queryFn: () => attendanceAPI.getByEmployee(employee.id, startDate, endDate),
    enabled: isOpen && !!employee,
  });

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.full_name}</h2>
              <p className="text-sm text-gray-600 mt-1">{employee.email}</p>
              <p className="text-sm text-gray-600">{employee.department}</p>
              
              {/* Stats */}
              <div className="flex gap-4 mt-3">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Present:</span>
                  <span className="ml-2 text-sm font-medium text-green-600">{employee.present_count}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Absent:</span>
                  <span className="ml-2 text-sm font-medium text-red-600">{employee.absent_count}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{employee.total_records}</span>
                </div>
              </div>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Records</h3>
          
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error loading attendance records</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {!isLoading && !error && attendanceRecords && attendanceRecords.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No attendance records found</p>
              <p className="text-sm text-gray-500 mt-2">
                {startDate || endDate ? 'Try adjusting your date filters' : 'No records available for this employee'}
              </p>
            </div>
          )}

          {!isLoading && !error && attendanceRecords && attendanceRecords.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            record.status === 'Present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.status === 'Present' ? (
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceModal;
