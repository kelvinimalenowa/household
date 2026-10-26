// load the things we need
const mongoose = require('mongoose');

// define the schema for our listing model
const listingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, required: true, trim: true },
    rent: { type: Number, required: true, min: 0 },
    link: { type: String, trim: true },
    notes: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imageCredit: { type: String },
    imageCreditUrl: { type: String },
    bedrooms: { type: Number },
    status: { type: String, enum: ["Interested", "Toured", "Applied", "Rejected"], default: "Interested" }
}, {
    timestamps: true
});

// create the model for listings and expose it to our app
module.exports = mongoose.model('Listing', listingSchema);