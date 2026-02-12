from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date, datetime, timedelta
from contextlib import asynccontextmanager

from database import engine, get_db, Base
from models import Employee, Attendance
from schemas import (
    EmployeeCreate,
    EmployeeResponse,
    AttendanceCreate,
    AttendanceResponse,
    ErrorResponse,
    DashboardSummary,
    EmployeeWithAttendance
)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Clean up resources if needed


app = FastAPI(title="HRMS Lite API", version="1.0.0", lifespan=lifespan)

# CORS Configuration (localhost and 127.0.0.1 for Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "HRMS Lite API is running"}


# Employee Endpoints
@app.post(
    "/api/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}}
)
async def create_employee(
    employee: EmployeeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new employee"""
    try:
        new_employee = Employee(
            full_name=employee.full_name,
            email=employee.email,
            department=employee.department
        )
        db.add(new_employee)
        await db.flush()
        await db.refresh(new_employee)
        return new_employee
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee with email {employee.email} already exists"
        )


@app.get("/api/employees", response_model=List[EmployeeResponse])
async def get_employees(db: AsyncSession = Depends(get_db)):
    """Get all employees"""
    result = await db.execute(select(Employee))
    employees = result.scalars().all()
    return employees


@app.delete(
    "/api/employees/{employee_id}",
    status_code=status.HTTP_200_OK,
    responses={404: {"model": ErrorResponse}}
)
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an employee by ID"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with id {employee_id} not found"
        )
    
    await db.delete(employee)
    await db.flush()
    return {"message": f"Employee {employee_id} deleted successfully"}


# Attendance Endpoints
@app.post(
    "/api/attendance",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}}
)
async def mark_attendance(
    attendance: AttendanceCreate,
    db: AsyncSession = Depends(get_db)
):
    """Mark attendance for an employee"""
    # Check if employee exists
    result = await db.execute(select(Employee).where(Employee.id == attendance.employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with id {attendance.employee_id} not found"
        )
    
    # Strip timezone info to match TIMESTAMP WITHOUT TIME ZONE in DB
    naive_date = attendance.date.replace(tzinfo=None) if attendance.date.tzinfo else attendance.date
    
    new_attendance = Attendance(
        employee_id=attendance.employee_id,
        date=naive_date,
        status=attendance.status
    )
    db.add(new_attendance)
    await db.flush()
    await db.refresh(new_attendance)
    return new_attendance


@app.get(
    "/api/attendance/{employee_id}",
    response_model=List[AttendanceResponse],
    responses={404: {"model": ErrorResponse}}
)
async def get_attendance(
    employee_id: int,
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get attendance records for an employee with optional date filtering"""
    # Check if employee exists
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with id {employee_id} not found"
        )
    
    # Build query with optional date filters
    query = select(Attendance).where(Attendance.employee_id == employee_id)
    
    if start_date:
        # Convert date to datetime at start of day for comparison
        start_datetime = datetime.combine(start_date, datetime.min.time())
        query = query.where(Attendance.date >= start_datetime)
    if end_date:
        # Convert date to datetime at end of day for inclusive comparison
        end_datetime = datetime.combine(end_date, datetime.max.time())
        query = query.where(Attendance.date <= end_datetime)
    
    query = query.order_by(Attendance.date.desc())
    
    result = await db.execute(query)
    attendances = result.scalars().all()
    return attendances


# Dashboard Endpoints
@app.get("/api/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard summary with employee and attendance statistics, optionally filtered by date range"""
    # Count total employees
    employee_count_result = await db.execute(select(func.count(Employee.id)))
    total_employees = employee_count_result.scalar() or 0
    
    # Build base query for attendance records with optional date filtering
    attendance_query = select(func.count(Attendance.id))
    if start_date:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        attendance_query = attendance_query.where(Attendance.date >= start_datetime)
    if end_date:
        end_datetime = datetime.combine(end_date, datetime.max.time())
        attendance_query = attendance_query.where(Attendance.date <= end_datetime)
    
    # Count total attendance records
    attendance_count_result = await db.execute(attendance_query)
    total_attendance_records = attendance_count_result.scalar() or 0
    
    # Count present records
    present_query = select(func.count(Attendance.id)).where(Attendance.status == "Present")
    if start_date:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        present_query = present_query.where(Attendance.date >= start_datetime)
    if end_date:
        end_datetime = datetime.combine(end_date, datetime.max.time())
        present_query = present_query.where(Attendance.date <= end_datetime)
    
    present_count_result = await db.execute(present_query)
    present_count = present_count_result.scalar() or 0
    
    # Count absent records
    absent_query = select(func.count(Attendance.id)).where(Attendance.status == "Absent")
    if start_date:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        absent_query = absent_query.where(Attendance.date >= start_datetime)
    if end_date:
        end_datetime = datetime.combine(end_date, datetime.max.time())
        absent_query = absent_query.where(Attendance.date <= end_datetime)
    
    absent_count_result = await db.execute(absent_query)
    absent_count = absent_count_result.scalar() or 0
    
    # Calculate attendance rate
    attendance_rate = (present_count / total_attendance_records * 100) if total_attendance_records > 0 else 0.0
    
    return DashboardSummary(
        total_employees=total_employees,
        total_attendance_records=total_attendance_records,
        present_count=present_count,
        absent_count=absent_count,
        attendance_rate=round(attendance_rate, 2)
    )


@app.get("/api/dashboard/employees", response_model=List[EmployeeWithAttendance])
async def get_employees_with_attendance(
    status: Optional[str] = Query(None, description="Filter by attendance status: 'Present' or 'Absent'"),
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get all employees with their attendance statistics, optionally filtered by status and date range"""
    # Get all employees
    employees_result = await db.execute(select(Employee))
    employees = employees_result.scalars().all()
    
    employees_with_attendance = []
    
    for employee in employees:
        # Build attendance query for this employee
        attendance_query = select(Attendance).where(Attendance.employee_id == employee.id)
        
        if start_date:
            start_datetime = datetime.combine(start_date, datetime.min.time())
            attendance_query = attendance_query.where(Attendance.date >= start_datetime)
        if end_date:
            end_datetime = datetime.combine(end_date, datetime.max.time())
            attendance_query = attendance_query.where(Attendance.date <= end_datetime)
        
        # Get all attendance records for this employee
        att_result = await db.execute(attendance_query)
        attendances = att_result.scalars().all()
        
        # Count present and absent
        present_count = sum(1 for a in attendances if a.status.value == "Present")
        absent_count = sum(1 for a in attendances if a.status.value == "Absent")
        total_records = len(attendances)
        
        # If status filter is applied, only include employees with that status
        if status:
            if status == "Present" and present_count == 0:
                continue
            if status == "Absent" and absent_count == 0:
                continue
        
        employees_with_attendance.append(
            EmployeeWithAttendance(
                id=employee.id,
                full_name=employee.full_name,
                email=employee.email,
                department=employee.department,
                present_count=present_count,
                absent_count=absent_count,
                total_records=total_records
            )
        )
    
    return employees_with_attendance
