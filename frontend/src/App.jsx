import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import AddEmployee from './components/AddEmployee';
import AttendanceTracker from './components/AttendanceTracker';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employee Management
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'attendance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance Tracker
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'dashboard' ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <Dashboard />
          </div>
        ) : activeTab === 'employees' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
              <AddEmployee />
            </div>
            <EmployeeList />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Tracker</h2>
            <AttendanceTracker />
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
