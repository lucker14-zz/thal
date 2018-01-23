const mongoose = require('mongoose');

let companyKladnoSchema = new mongoose.Schema({
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

let CompanyKladno = mongoose.model('CompanyKladno', companyKladnoSchema);

module.exports = CompanyKladno;