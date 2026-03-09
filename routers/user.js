const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { verifyToken, verifyTokenAndAdmin } = require('../middleware/auth');

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/users/register
 * @access  Public
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    // 1. التحقق من وجود البيانات
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'البيانات ناقصة، يرجى إدخال الاسم والبريد والباسورد' });
    }

    // 2. التحقق من تكرار البريد
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    // 3. إنشاء المستخدم (التشفير يتم في الـ Model pre-save)
    const user = new User({ fullName, email, password });
    await user.save();

    // 4. إنشاء التوكن (استخدام id ليتوافق مع AuthService في الفرونت)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '8d' }
    );

    const { password: _, ...userResponse } = user.toObject();

    // 5. الرد بنفس التنسيق المتوقع في الفرونت
    res.status(201).json({ 
      user: userResponse, 
      token 
    });
  })
);

/**
 * @desc    تسجيل دخول
 * @route   POST /api/users/login
 * @access  Public
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. البحث عن المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'بيانات الدخول غير صحيحة (المستخدم غير موجود)' });
    }

    // 2. التحقق من الباسورد (باستخدام الميثود الموجودة في الموديل)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة (الباسورد خطأ)' });
    }

    // 3. إنشاء التوكن
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '8d' }
    );

    const { password: _, ...userResponse } = user.toObject();

    // 4. إرسال الرد
    res.status(200).json({ 
      user: userResponse, 
      token 
    });
  })
);

/**
 * @desc    جلب كل المستخدمين (للأدمن فقط)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
router.get(
  '/',
  verifyTokenAndAdmin,
  asyncHandler(async (req, res) => {
    // جلب المستخدمين بدون إرسال الباسوردات
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    // الفرونت إند (AuthService.getAllUsers) يتوقع Array مباشر من المستخدمين
    res.status(200).json(users);
  })
);

module.exports = router;