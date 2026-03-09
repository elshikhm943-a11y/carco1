const express = require("express");
const router = express.Router();
const multer = require("multer");
const asyncHandler = require("express-async-handler");
const Car = require("../models/Car");
const { verifyTokenAndAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer في الذاكرة فقط
const upload = multer({ storage: multer.memoryStorage() });

// رفع الصورة إلى Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "cars_store", transformation: [{ width: 800, height: 800, crop: "limit" }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    ).end(file.buffer);
  });
};

// جلب كل العربيات
router.get("/", asyncHandler(async (req, res) => {
  const cars = await Car.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, cars });
}));

// جلب عربية واحدة
router.get("/:id", asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: "السيارة غير موجودة" });
  res.status(200).json({ success: true, car });
}));

// إنشاء عربية جديدة
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const data = req.body;

  if (!req.files || req.files.length === 0)
    return res.status(400).json({ message: "يجب رفع صورة واحدة على الأقل" });

  const images = await Promise.all(req.files.map(file => uploadToCloudinary(file)));

  const car = new Car({
    ...data,
    images,
    doors: data.doors ? Number(data.doors) : undefined,
    horsepower: data.horsepower ? Number(data.horsepower) : undefined,
    engineCapacity: data.engineCapacity ? Number(data.engineCapacity) : undefined,
    year: data.year ? Number(data.year) : undefined,
    kilometers: data.kilometers ? Number(data.kilometers) : undefined,
    features: data.features ? (typeof data.features === "string" ? JSON.parse(data.features) : data.features) : []
  });

  await car.save();
  res.status(201).json({ success: true, message: "تم إنشاء السيارة بنجاح", car });
}));

// تحديث عربية
router.put("/:id", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const data = req.body;

  let car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: "السيارة غير موجودة" });

  let images = data.existingImages
    ? (typeof data.existingImages === "string" ? JSON.parse(data.existingImages) : data.existingImages)
    : [];

  if (req.files?.length) {
    const newImages = await Promise.all(req.files.map(file => uploadToCloudinary(file)));
    images = [...images, ...newImages];
  }

  Object.assign(car, { ...data, images });

  // تحويل بعض الحقول إلى أرقام إذا موجودة
  if (data.doors) car.doors = Number(data.doors);
  if (data.horsepower) car.horsepower = Number(data.horsepower);
  if (data.engineCapacity) car.engineCapacity = Number(data.engineCapacity);
  if (data.year) car.year = Number(data.year);
  if (data.kilometers) car.kilometers = Number(data.kilometers);
  if (data.features) car.features = typeof data.features === "string" ? JSON.parse(data.features) : data.features;

  await car.save();
  res.status(200).json({ success: true, message: "تم تحديث السيارة بنجاح", car });
}));

// حذف عربية
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const car = await Car.findByIdAndDelete(req.params.id);
  if (!car) return res.status(404).json({ message: "السيارة غير موجودة" });
  res.status(200).json({ success: true, message: "تم حذف السيارة بنجاح" });
}));

module.exports = router;