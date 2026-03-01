const ContactMessage = require('../models/ContactMessage');
const { sendContactConfirmationEmail } = require('../utils/emailService');

// POST /api/contact - logged-in user sends message (requires auth)
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const contact = await ContactMessage.create({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will contact you soon.',
      data: contact
    });

    // Send confirmation email to the user (async)
    try {
      await sendContactConfirmationEmail(req.user.name, req.user.email);
    } catch (emailErr) {
      console.error('[Email] Contact confirmation email failed:', emailErr.message);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/contact - get all messages (admin)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/contact/:id/status - update message status (admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/contact/:id - delete message (admin)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
