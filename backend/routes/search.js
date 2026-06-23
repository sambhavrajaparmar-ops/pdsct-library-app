const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Advanced Search - Books
router.get('/books', async (req, res) => {
  try {
    const { query, category, author, yearFrom, yearTo, availability } = req.query;
    
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (query) {
      sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (author) {
      sql += ' AND author LIKE ?';
      params.push(`%${author}%`);
    }

    if (yearFrom) {
      sql += ' AND publication_year >= ?';
      params.push(yearFrom);
    }

    if (yearTo) {
      sql += ' AND publication_year <= ?';
      params.push(yearTo);
    }

    if (availability) {
      if (availability === 'available') {
        sql += ' AND available_copies > 0';
      } else if (availability === 'unavailable') {
        sql += ' AND available_copies = 0';
      }
    }

    sql += ' ORDER BY title ASC';

    const connection = await pool.getConnection();
    const [books] = await connection.query(sql, params);
    connection.release();

    res.json({
      success: true,
      total: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Advanced Search - Students
router.get('/students', async (req, res) => {
  try {
    const { query, class: studentClass, department, status, hasOverdue } = req.query;
    
    let sql = `
      SELECT s.*, 
             (SELECT COUNT(*) FROM issues WHERE student_id = s.id AND status = 'active' AND due_date < CURDATE()) as overdue_count,
             (SELECT SUM(fine_amount) FROM issues WHERE student_id = s.id AND status = 'active') as pending_fine
      FROM students s
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ' AND (name LIKE ? OR roll_number LIKE ? OR email LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (studentClass) {
      sql += ' AND class = ?';
      params.push(studentClass);
    }

    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (hasOverdue === 'true') {
      sql += ' AND (SELECT COUNT(*) FROM issues WHERE student_id = s.id AND status = "active" AND due_date < CURDATE()) > 0';
    }

    sql += ' ORDER BY name ASC';

    const connection = await pool.getConnection();
    const [students] = await connection.query(sql, params);
    connection.release();

    res.json({
      success: true,
      total: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Advanced Search - Issues
router.get('/issues', async (req, res) => {
  try {
    const { studentId, bookId, status, overdue, dateFrom, dateTo } = req.query;
    
    let sql = `
      SELECT i.*, b.title as book_title, s.name as student_name
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN students s ON i.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (studentId) {
      sql += ' AND i.student_id = ?';
      params.push(studentId);
    }

    if (bookId) {
      sql += ' AND i.book_id = ?';
      params.push(bookId);
    }

    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    if (overdue === 'true') {
      sql += ' AND i.due_date < CURDATE() AND i.status = "active"';
    }

    if (dateFrom) {
      sql += ' AND i.issue_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ' AND i.issue_date <= ?';
      params.push(dateTo);
    }

    sql += ' ORDER BY i.issue_date DESC';

    const connection = await pool.getConnection();
    const [issues] = await connection.query(sql, params);
    connection.release();

    res.json({
      success: true,
      total: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Unique Categories
router.get('/categories', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categories] = await connection.query('SELECT DISTINCT category FROM books ORDER BY category');
    connection.release();

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Unique Authors
router.get('/authors', async (req, res) => {
  try {
    const { query } = req.query;
    
    let sql = 'SELECT DISTINCT author FROM books WHERE 1=1';
    const params = [];

    if (query) {
      sql += ' AND author LIKE ?';
      params.push(`%${query}%`);
    }

    sql += ' ORDER BY author LIMIT 20';

    const connection = await pool.getConnection();
    const [authors] = await connection.query(sql, params);
    connection.release();

    res.json({
      success: true,
      data: authors.map(a => a.author)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Unique Classes
router.get('/classes', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [classes] = await connection.query('SELECT DISTINCT class FROM students ORDER BY class');
    connection.release();

    res.json({
      success: true,
      data: classes.map(c => c.class).filter(c => c !== null)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Unique Departments
router.get('/departments', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [departments] = await connection.query('SELECT DISTINCT department FROM students ORDER BY department');
    connection.release();

    res.json({
      success: true,
      data: departments.map(d => d.department).filter(d => d !== null)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global Search (across books, students, and issues)
router.get('/global', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${query}%`;
    const connection = await pool.getConnection();

    // Search books
    const [books] = await connection.query(
      'SELECT "book" as type, id, title as name, author, category FROM books WHERE title LIKE ? OR author LIKE ? LIMIT 5',
      [searchTerm, searchTerm]
    );

    // Search students
    const [students] = await connection.query(
      'SELECT "student" as type, id, name, roll_number, class FROM students WHERE name LIKE ? OR roll_number LIKE ? OR email LIKE ? LIMIT 5',
      [searchTerm, searchTerm, searchTerm]
    );

    connection.release();

    res.json({
      success: true,
      results: {
        books: books,
        students: students,
        total: books.length + students.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
