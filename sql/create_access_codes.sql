-- SQL for creating the access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(255) NOT NULL,
  panels JSON NOT NULL,
  editableByLeader BOOLEAN DEFAULT FALSE
);