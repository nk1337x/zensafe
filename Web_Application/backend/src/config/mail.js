const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "senaaravichandran@gmail.com",
    pass: "ewcl tisw ldbk kwdv",
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Connection Successful:", success);
  }
});

module.exports = transporter;
