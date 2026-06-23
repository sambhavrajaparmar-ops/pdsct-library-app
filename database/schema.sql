-- PDSCT Library Management System - Database Schema

CREATE DATABASE IF NOT EXISTS pdsct_library;
USE pdsct_library;

-- Books Table
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  category VARCHAR(100),
  publication_year INT,
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  location VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  class VARCHAR(50),
  department VARCHAR(100),
  enrollment_date DATE,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  total_fines DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Book Issues Table
CREATE TABLE issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  book_id INT NOT NULL,
  student_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
  fine_amount DECIMAL(10, 2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Fine History Table
CREATE TABLE fines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  issue_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255),
  paid_date DATE,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (issue_id) REFERENCES issues(id)
);

-- Admin Users Table
CREATE TABLE admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'librarian', 'staff') DEFAULT 'librarian',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Activity Log Table
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Create Indexes
CREATE INDEX idx_book_title ON books(title);
CREATE INDEX idx_book_category ON books(category);
CREATE INDEX idx_student_roll ON students(roll_number);
CREATE INDEX idx_issue_student ON issues(student_id);
CREATE INDEX idx_issue_book ON issues(book_id);
CREATE INDEX idx_issue_status ON issues(status);
CREATE INDEX idx_fine_student ON fines(student_id);

-- Sample Data
INSERT INTO books (title, author, isbn, category, publication_year, total_copies, available_copies, location) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 1925, 5, 5, 'A1'),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 1960, 4, 4, 'A2'),
('1984', 'George Orwell', '978-0-451-52493-2', 'Science Fiction', 1949, 3, 3, 'A3'),
('Data Science Handbook', 'Jake VanderPlas', '978-1-491-91205-8', 'Technical', 2016, 2, 2, 'B1'),
('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'Technical', 2008, 2, 2, 'B2');

INSERT INTO admin_users (username, email, password_hash, role) VALUES
('admin', 'admin@pdsct.edu', 'hashed_password_here', 'admin'),
('librarian1', 'librarian@pdsct.edu', 'hashed_password_here', 'librarian');
