const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  images: { type: [String], required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  type: { type: String },
  operationType: { type: String },
  status: { type: String },
  addedDate: { type: Date },
  factoryCondition: { type: String },
  doors: { type: Number },
  modification: { type: String },
  horsepower: { type: Number },
  engineCapacity: { type: Number },
  fuelType: { type: String },
  transmission: { type: String },
  year: { type: Number },
  kilometers: { type: Number },
  color: { type: String },
  features: { type: [String] }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);