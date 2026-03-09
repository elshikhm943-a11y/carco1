const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order'); 
const { verifyToken, verifyTokenAndAdmin } = require('../middleware/auth');

// 1. إنشاء طلب جديد (يوافق createOrder في الأنجولار)
router.post(
  '/create',
  verifyToken,
  asyncHandler(async (req, res) => {
    const dto = req.body;
    const newOrder = new Order({
      ...dto,
      user: req.user.id,
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Order created', at: new Date() }]
    });
    await newOrder.save();
    res.status(201).json(newOrder); // نبعت الأوبجكت مباشرة
  })
);

// 2. تحديث طلب موجود (يوافق updateOrder - PATCH في الأنجولار)
router.patch(
  '/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'الطلب غير موجود' });
    res.status(200).json(updatedOrder);
  })
);

// 3. جلب طلبات المستخدم (يوافق getMyOrders)
router.get(
  '/my-orders',
  verifyToken,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
      .populate('productId')
      .sort({ createdAt: -1 });
    res.status(200).json(orders); // الأنجولار متوقع Array مباشرة
  })
);

// 4. جلب كل الطلبات للأدمن (يوافق getAllOrdersAdmin)
router.get(
  '/admin/all',
  verifyTokenAndAdmin,
  asyncHandler(async (req, res) => {
    const orders = await Order.find()
      .populate('user', 'fullName email')
      .populate('productId')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  })
);

// 5. تحديث حالة الطلب للأدمن (يوافق updateStatusAdmin)
router.patch(
  '/admin/update-status/:id',
  verifyTokenAndAdmin,
  asyncHandler(async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { status: req.body.status },
        $push: { statusHistory: { status: req.body.status, at: new Date(), note: 'Updated by Admin' } }
      },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  })
);

module.exports = router;