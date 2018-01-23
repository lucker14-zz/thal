const mongoose = require('mongoose');

let companySchema = new mongoose.Schema({
    name: String,
    addr: String,
    street: String,
    city: String,
    zip: String,
    tele: String,
    site: String,
    email: String,
    logo_url: String,
    photo_url: String,
    dateCrawled: Date
});

let Company = mongoose.model('Company', companySchema);

module.exports = Company;