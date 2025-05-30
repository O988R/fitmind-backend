const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');

// التحقق من وجود توكن JWT صالح
const protect = async (req, res, next) => {
  try {
    let token;

    // التحقق من وجود ترويسة Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // الحصول على التوكن من الترويسة
      token = req.headers.authorization.split(' ')[1];

      // التحقق من صحة التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitmind_jwt_secret');

      // البحث عن المستخدم بواسطة المعرف
      const user = await findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'غير مصرح لك بالوصول' });
      }

      // إضافة معلومات المستخدم إلى الطلب
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      next();
    } else {
      res.status(401).json({ message: 'غير مصرح لك بالوصول، توكن غير موجود' });
    }
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error);
    res.status(401).json({ message: 'غير مصرح لك بالوصول، توكن غير صالح' });
  }
};

module.exports = { protect };
