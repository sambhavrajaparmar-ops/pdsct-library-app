const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate Books Report
router.get('/books', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [books] = await connection.query('SELECT * FROM books ORDER BY title');
    connection.release();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Books');

    // Headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 25 },
      { header: 'ISBN', key: 'isbn', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Year', key: 'publication_year', width: 8 },
      { header: 'Total Copies', key: 'total_copies', width: 12 },
      { header: 'Available', key: 'available_copies', width: 12 },
      { header: 'Location', key: 'location', width: 10 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF007AFF' }
    };

    // Add data
    books.forEach(book => {
      worksheet.addRow(book);
    });

    // Add summary
    const summaryRow = worksheet.addRow([]);
    summaryRow.getCell(1).value = 'SUMMARY';
    summaryRow.font = { bold: true, size: 12 };

    worksheet.addRow({
      title: 'Total Books:',
      author: books.length
    });

    worksheet.addRow({
      title: 'Total Copies:',
      author: books.reduce((sum, b) => sum + b.total_copies, 0)
    });

    worksheet.addRow({
      title: 'Available Copies:',
      author: books.reduce((sum, b) => sum + b.available_copies, 0)
    });

    worksheet.addRow({
      title: 'Issued Copies:',
      author: books.reduce((sum, b) => sum + (b.total_copies - b.available_copies), 0)
    });

    const fileName = `books-report-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, `Books-Report-${new Date().toLocaleDateString()}.xlsx`, () => {
      fs.unlink(filePath, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Students Report
router.get('/students', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [students] = await connection.query('SELECT * FROM students ORDER BY name');
    connection.release();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Roll Number', key: 'roll_number', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Class', key: 'class', width: 12 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Total Fines', key: 'total_fines', width: 12 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF007AFF' }
    };

    students.forEach(student => {
      worksheet.addRow(student);
    });

    const fileName = `students-report-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, `Students-Report-${new Date().toLocaleDateString()}.xlsx`, () => {
      fs.unlink(filePath, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Issues Report
router.get('/issues', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [issues] = await connection.query(`
      SELECT 
        i.id,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.status,
        i.fine_amount,
        b.title as book_title,
        b.author,
        s.name as student_name,
        s.roll_number
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN students s ON i.student_id = s.id
      ORDER BY i.issue_date DESC
    `);
    connection.release();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Issues');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Book Title', key: 'book_title', width: 30 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Student Name', key: 'student_name', width: 20 },
      { header: 'Roll Number', key: 'roll_number', width: 12 },
      { header: 'Issue Date', key: 'issue_date', width: 12 },
      { header: 'Due Date', key: 'due_date', width: 12 },
      { header: 'Return Date', key: 'return_date', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Fine (₹)', key: 'fine_amount', width: 10 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF007AFF' }
    };

    issues.forEach(issue => {
      worksheet.addRow(issue);
    });

    const fileName = `issues-report-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, `Issues-Report-${new Date().toLocaleDateString()}.xlsx`, () => {
      fs.unlink(filePath, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Overdue Books Report
router.get('/overdue', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [overdue] = await connection.query(`
      SELECT 
        i.id,
        b.title,
        b.author,
        s.name,
        s.roll_number,
        s.email,
        i.due_date,
        DATEDIFF(CURDATE(), i.due_date) as days_overdue,
        (DATEDIFF(CURDATE(), i.due_date) * 10) as fine_amount
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN students s ON i.student_id = s.id
      WHERE i.status = 'active' AND i.due_date < CURDATE()
      ORDER BY i.due_date ASC
    `);
    connection.release();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Overdue Books');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Book Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Student Name', key: 'name', width: 20 },
      { header: 'Roll Number', key: 'roll_number', width: 12 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Due Date', key: 'due_date', width: 12 },
      { header: 'Days Overdue', key: 'days_overdue', width: 12 },
      { header: 'Fine Amount (₹)', key: 'fine_amount', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    };

    overdue.forEach(item => {
      worksheet.addRow(item);
    });

    const fileName = `overdue-report-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, `Overdue-Report-${new Date().toLocaleDateString()}.xlsx`, () => {
      fs.unlink(filePath, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Analytics Summary
router.get('/analytics', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [bookStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_books,
        SUM(total_copies) as total_copies,
        SUM(available_copies) as available_copies
      FROM books
    `);

    const [studentStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_students,
        SUM(total_fines) as total_fines_pending
      FROM students
    `);

    const [issueStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_issues,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_issues,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_issues,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_issues,
        SUM(CASE WHEN status = 'overdue' THEN fine_amount ELSE 0 END) as total_pending_fine
      FROM issues
    `);

    connection.release();

    res.json({
      success: true,
      data: {
        books: bookStats[0],
        students: studentStats[0],
        issues: issueStats[0],
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
