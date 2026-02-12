from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional
from models import AttendanceStatus


# Employee Schemas
class EmployeeBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    department: str = Field(..., min_length=1, max_length=100)


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


# Attendance Schemas
class AttendanceBase(BaseModel):
    employee_id: int
    date: datetime
    status: AttendanceStatus


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceResponse(AttendanceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


# Error Response Schema
class ErrorResponse(BaseModel):
    detail: str


# Dashboard Schema
class DashboardSummary(BaseModel):
    total_employees: int
    total_attendance_records: int
    present_count: int
    absent_count: int
    attendance_rate: float


# Detailed Employee with Attendance Info
class EmployeeWithAttendance(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    full_name: str
    email: str
    department: str
    present_count: int
    absent_count: int
    total_records: int
