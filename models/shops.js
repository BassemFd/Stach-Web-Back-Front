var mongoose = require('mongoose');

var offerSchema = mongoose.Schema({
    type: String,
    price: Number,
    duration: Number,
});

var packageSchema = mongoose.Schema({
    type: String,
    price: Number,
    duration: Number,
    description: String,
});

var scheduleSchema = mongoose.Schema({
    dayOfTheWeek: String,
    openingHours: Number,
    closingHours: Number,
});

var shopSchema = mongoose.Schema({
    shopName: {type: String, required: true},
    shopImages: Array,
    shopAddress: {type: String, required: true},
    latitude: Number,
    longitude: Number,
    shopPhone: {type: String, required: true},
    shopMail: {type: String, required: true, unique: true},
    shopDescription: {type: String, required: true},
    shopFeatures: Array,
    comments: [ {type: mongoose.Schema.Types.ObjectId, ref: 'comments'} ],
    shopEmployees: Array,
    offers: [offerSchema], 
    packages: [packageSchema],
    schedule: [scheduleSchema],
    atHome: Boolean,
    appointments: [ {type: mongoose.Schema.Types.ObjectId, ref: 'appointments'} ],
    priceFork: Number,
    rating: Number,
});

var ShopModel = mongoose.model('shops', shopSchema);

module.exports = ShopModel;