const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    // console.log("MAIL CONFIG:", process.env.MAIL_HOST, process.env.MAIL_USER);

    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure: false,
      port: 465,
    })

    let info = await transporter.sendMail({
      from: `"GhumoBee" <${process.env.MAIL_USER}>`, // sender address
      to: `${email}`, // list of receivers
      subject: `${title}`, // Subject line
      html: `${body}`, // html body
    })
    console.log(info.response)
    return info
  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

module.exports = mailSender
