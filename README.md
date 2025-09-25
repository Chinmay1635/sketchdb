# Database Schema Designer

A visual database schema designer built with React Flow that allows you to create, edit, and export database schemas with automatic relationship management.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── TableNode.tsx    # Custom table node for React Flow
│   ├── Sidebar.tsx      # Attribute editing sidebar
│   ├── SQLDialog.tsx    # SQL export dialog
│   ├── DeleteConfirmDialog.tsx # Delete confirmation dialog
│   ├── Toolbar.tsx      # Main toolbar with buttons
│   └── index.ts         # Component exports
├── hooks/               # Custom React hooks
│   └── useTableManagement.ts # Table state management hook
├── utils/               # Utility functions
│   ├── sqlGenerator.ts  # SQL generation utilities
│   └── connectionUtils.ts # Connection handling utilities
├── types/               # TypeScript type definitions
│   └── index.ts         # All type definitions
└── App.tsx             # Main application component
```

## Features

### 🗃️ Table Management
- **Add Tables**: Create new database tables with custom names
- **Edit Table Names**: Click table names to edit them inline
- **Delete Tables**: Remove tables with confirmation dialog

### 🏗️ Attribute Management
- **Add Attributes**: Add columns with custom names and data types
- **Data Types**: Support for VARCHAR, INT, TEXT, DATE, JSON, and more
- **Attribute Types**: Normal, Primary Key (PK), Foreign Key (FK)
- **Visual Indicators**: 🔑 for Primary Keys, 🔗 for Foreign Keys

### 🔗 Relationship Management
- **Visual Connections**: Drag from any attribute to another to create relationships
- **Automatic Constraints**: Connecting attributes automatically sets up PK/FK relationships
- **Connection Validation**: Prevents invalid connections (self-connections)
- **Real-time Updates**: Changes reflect immediately in the interface

### 📤 SQL Export
- **Two-Phase Generation**: Creates tables first, then adds foreign key constraints
- **Proper Constraints**: Generates PRIMARY KEY and FOREIGN KEY constraints
- **Copy to Clipboard**: One-click copying of generated SQL
- **Named Constraints**: Foreign keys get descriptive constraint names
