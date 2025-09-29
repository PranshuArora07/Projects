const nodemailer = require("nodemailer")

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,//email server
      auth: {
        user: process.env.MAIL_USER,//email id jisse bhej rhe hai mail
        pass: process.env.MAIL_PASS,// email id ka password
      },
      secure: false, //initial connection is not secure but before sending something they switch to secure version using starttls command
    })

    let info = await transporter.sendMail({
      from: `"StudyNotion" <${process.env.MAIL_USER}>`, // sender address
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

//info object is like 
// {
//   accepted: [ 'recipient@example.com' ],
//   rejected: [],
//   envelope: {
//     from: 'yourmail@example.com',
//     to: [ 'recipient@example.com' ]
//   },
//   messageId: '<1234@yourdomain.com>',
//   response: '250 OK: message accepted' // ✅ THIS is the SMTP server's response
// }
