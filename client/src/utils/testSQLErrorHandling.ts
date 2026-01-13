// Test cases for SQL error handling

// Test 1: Invalid SQL syntax
const invalidSyntaxSQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY
  name VARCHAR(255) -- Missing comma here
  email VARCHAR(255)
);
`;

// Test 2: Missing foreign key reference
const missingReferenceSQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255),
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES non_existent_table(id)
);
`;

// Test 3: Duplicate table names
const duplicateTablesSQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255)
);
`;

// Test 4: Empty SQL
const emptySQL = "";

// Test 5: SQL with comments only
const commentsOnlySQL = `
-- This is just a comment
/* This is a block comment */
`;

// Test 6: Valid SQL that should work
const validSQL = `
CREATE TABLE users (
  id INTEGER NOT NULL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE
);

CREATE TABLE posts (
  id INTEGER NOT NULL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

export const testCases = {
  invalidSyntaxSQL,
  missingReferenceSQL,
  duplicateTablesSQL,
  emptySQL,
  commentsOnlySQL,
  validSQL
};

// Instructions for testing:
// 1. Copy each test case into the Import Dialog
// 2. Verify that appropriate error messages are shown
// 3. Check that error details and suggestions are helpful
// 4. Ensure retry functionality works when available