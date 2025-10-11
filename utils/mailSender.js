// const nodemailer = require("nodemailer");

// const mailSender = async (email, title, body) => {
//   try {
//     // console.log("MAIL CONFIG:", process.env.MAIL_HOST, process.env.MAIL_USER);

//     let transporter = nodemailer.createTransport({
//       host: process.env.MAIL_HOST,
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//       },
//       secure: false,
//       port: process.env.MAIL_PORT,
//     })

//     let info = await transporter.sendMail({
//       from: `"GhumoBee" <${process.env.MAIL_USER}>`, // sender address
//       to: `${email}`, // list of receivers
//       subject: `${title}`, // Subject line
//       html: `${body}`, // html body
//     })
//     console.log(info.response)
//     return info
//   } catch (error) {
//     console.log(error.message)
//     return error.message
//   }
// }



// module.exports = mailSender



const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = client.authentications['api-key'];
apiKeyAuth.apiKey = process.env.BREVO_API_KEY; // from .env

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * sendMailBrevo
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} htmlBody
 */
async function mailSender(toEmail, subject, htmlBody) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not set in env');
  }

  const sendSmtpEmail = {
    sender: {
      email: 'info@ghumobee.com',
      name: 'GhumoBee'
    },
    to: [{ email: toEmail }],
    subject,
    htmlContent: htmlBody
  };

  try {
    const result = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    // result is usually an object with messageId / accepted recipients info
    console.log('Brevo: email queued/sent (ok).');
    return result;
  } catch (err) {
    // don't print secrets — show diagnostic info only
    const errBody = err && err.response && err.response.body ? err.response.body : err;
    console.error('Brevo send error:', typeof errBody === 'object' ? JSON.stringify(errBody) : errBody);
    throw err;
  }
}

module.exports = mailSender;
