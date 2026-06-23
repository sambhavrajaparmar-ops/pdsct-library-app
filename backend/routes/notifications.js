const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Send Overdue Notification
router.post('/send-overdue-alert', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [overdueIssues] = await connection.query(`
      SELECT 
        i.id,
        b.title,
        b.author,
        s.name,
        s.email,
        i.due_date,
        DATEDIFF(CURDATE(), i.due_date) as days_overdue,
        (DATEDIFF(CURDATE(), i.due_date) * 10) as fine_amount
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN students s ON i.student_id = s.id
      WHERE i.status = 'active' AND i.due_date < CURDATE()
    `);
    connection.release();

    let sentCount = 0;

    for (const issue of overdueIssues) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: issue.email,
          subject: '⚠️ PDSCT Library - Overdue Book Notice',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h1>📚 PDSCT Library</h1>
                <p>Overdue Book Notification</p>
              </div>
              <div style="padding: 30px; background: #f5f5f5;">
                <h2>Dear ${issue.name},</h2>
                <p>This is to inform you that the following book is <strong>OVERDUE</strong>:</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #FF6B6B;">
                  <p><strong>Book Title:</strong> ${issue.title}</p>
                  <p><strong>Author:</strong> ${issue.author}</p>
                  <p><strong>Due Date:</strong> ${issue.due_date}</p>
                  <p><strong>Days Overdue:</strong> <span style="color: #FF6B6B; font-weight: bold;">${issue.days_overdue} days</span></p>
                  <p><strong>Fine Amount:</strong> <span style="color: #FF6B6B; font-weight: bold;">₹${issue.fine_amount}</span></p>
                </div>

                <p style="color: #666; background: #fffacd; padding: 15px; border-radius: 5px;">
                  ⏰ Please return this book at your earliest convenience to avoid additional fines.
                </p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p>&copy; 2026 Pandit Dev Prabhakar Shashtri College of Technology</p>
              </div>
            </div>
          `
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Error sending email to ${issue.email}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: `Overdue notifications sent to ${sentCount} students`,
      totalOverdue: overdueIssues.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send New Book Arrival Notification
router.post('/send-new-book-alert', async (req, res) => {
  try {
    const { bookId } = req.body;
    
    const connection = await pool.getConnection();
    
    // Get book details
    const [books] = await connection.query('SELECT * FROM books WHERE id = ?', [bookId]);
    
    if (books.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const book = books[0];

    // Get all active students
    const [students] = await connection.query('SELECT email, name FROM students WHERE status = "active"');
    connection.release();

    let sentCount = 0;

    for (const student of students) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: '📚 PDSCT Library - New Book Arrival!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h1>📚 PDSCT Library</h1>
                <p>New Book Arrival Alert</p>
              </div>
              <div style="padding: 30px; background: #f5f5f5;">
                <h2>Hi ${student.name}! 👋</h2>
                <p>We're excited to announce that a new book has arrived in our library!</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #4ECDC4;">
                  <p><strong>Title:</strong> ${book.title}</p>
                  <p><strong>Author:</strong> ${book.author}</p>
                  <p><strong>Category:</strong> ${book.category}</p>
                  <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                  <p><strong>Available Copies:</strong> ${book.available_copies}</p>
                  <p><strong>Location:</strong> ${book.location}</p>
                </div>

                ${book.description ? `
                  <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Description:</strong></p>
                    <p>${book.description}</p>
                  </div>
                ` : ''}

                <p style="color: #666; background: #e8f5e9; padding: 15px; border-radius: 5px;">
                  ✨ Rush to the library and grab your copy today! Limited copies available.
                </p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p>&copy; 2026 Pandit Dev Prabhakar Shashtri College of Technology</p>
              </div>
            </div>
          `
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Error sending email to ${student.email}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: `New book notification sent to ${sentCount} students`,
      book: book
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send Book Return Reminder
router.post('/send-return-reminder', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get books due in next 3 days
    const [upcomingReturns] = await connection.query(`
      SELECT 
        i.id,
        b.title,
        b.author,
        s.name,
        s.email,
        i.due_date,
        DATEDIFF(i.due_date, CURDATE()) as days_remaining
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN students s ON i.student_id = s.id
      WHERE i.status = 'active' 
        AND i.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      ORDER BY i.due_date ASC
    `);
    connection.release();

    let sentCount = 0;

    for (const issue of upcomingReturns) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: issue.email,
          subject: '📖 PDSCT Library - Book Return Reminder',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #45B7D1 0%, #0093E9 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h1>📚 PDSCT Library</h1>
                <p>Book Return Reminder</p>
              </div>
              <div style="padding: 30px; background: #f5f5f5;">
                <h2>Hello ${issue.name},</h2>
                <p>We wanted to remind you that your book is due for return soon!</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #45B7D1;">
                  <p><strong>Book Title:</strong> ${issue.title}</p>
                  <p><strong>Author:</strong> ${issue.author}</p>
                  <p><strong>Due Date:</strong> ${issue.due_date}</p>
                  <p><strong>Days Remaining:</strong> <span style="color: #0093E9; font-weight: bold;">${issue.days_remaining} day(s)</span></p>
                </div>

                <p style="color: #666; background: #e3f2fd; padding: 15px; border-radius: 5px;">
                  📍 Please return the book on time to avoid late fines. Thank you!
                </p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p>&copy; 2026 Pandit Dev Prabhakar Shashtri College of Technology</p>
              </div>
            </div>
          `
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Error sending email to ${issue.email}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: `Return reminders sent to ${sentCount} students`,
      totalReminders: upcomingReturns.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Notifications/Alerts
router.get('/dashboard', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [overdueBooks] = await connection.query(`
      SELECT COUNT(*) as count FROM issues 
      WHERE status = 'active' AND due_date < CURDATE()
    `);

    const [upcomingReturns] = await connection.query(`
      SELECT COUNT(*) as count FROM issues 
      WHERE status = 'active' AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    `);

    const [pendingFines] = await connection.query(`
      SELECT COUNT(*) as count, SUM(fine_amount) as total FROM issues 
      WHERE status = 'active' AND fine_amount > 0
    `);

    const [studentsWithFines] = await connection.query(`
      SELECT COUNT(*) as count FROM students 
      WHERE total_fines > 0
    `);

    connection.release();

    res.json({
      success: true,
      alerts: {
        overdueBooks: overdueBooks[0].count || 0,
        upcomingReturns: upcomingReturns[0].count || 0,
        pendingFines: {
          count: pendingFines[0].count || 0,
          totalAmount: pendingFines[0].total || 0
        },
        studentsWithFines: studentsWithFines[0].count || 0
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
