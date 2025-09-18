# Unused Modules

This folder contains modules that were moved from the main application to focus on core functionality due to time constraints.

## Core Focus
The main application now focuses only on:
- **SuperAdmin Dashboard** - Hospital and system management
- **Admin Dashboard** - Hospital staff management
- **Doctor Dashboard** - Patient care and prescriptions
- **Patient Dashboard** - Personal health management and appointment booking
- **Appointment System** - Complete booking and management
- **AI Health Assistant** - Integrated across all dashboards
- **Authentication System** - Complete user management

## Moved Modules

### Frontend Components
- `PharmacyDashboard.tsx` - Complete pharmacy inventory management interface
- `ReceptionistDashboard.tsx` - Reception and patient registration interface

### Backend Components
- **Models:**
  - `Inventory.js` - Medication and supplies inventory model
  - `Department.js` - Hospital department management model

- **Routes:**
  - `inventory.js` - Pharmacy inventory API routes
  - `department.js` - Department management API routes

- **Controllers:**
  - `inventoryController.js` - Inventory management logic
  - `departmentController.js` - Department management logic

### Documentation
- `PHARMACY_DASHBOARD_ENHANCEMENTS.md` - Complete pharmacy system documentation

## Status
All moved modules are **fully functional** and can be easily reintegrated when needed. They were removed from the main application to:
1. Reduce complexity during development
2. Focus on core hospital management features
3. Ensure stable deployment of essential functionality

## Reintegration
To reintegrate any module:
1. Move files back to their original locations
2. Update `App.tsx` imports and routes
3. Update `server.js` model imports and route registrations
4. Update `DashboardRedirect.tsx` for role routing
5. Restore role permissions in relevant route files

## Notes
- All moved code maintains the same medical theme and UI consistency
- Database models are preserved and compatible
- API endpoints follow the same patterns as active modules
- Authentication and authorization patterns are maintained
