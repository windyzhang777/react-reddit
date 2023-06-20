import nodemailer from "nodemailer";

export async function sendEmail(to: string, html: string) {
  // let testAccount = await nodemailer.createTestAccount();
  // console.log(`------- testAccount :`, testAccount);
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "kllhdvhm6s2slss6@ethereal.email",
      pass: "ZPCgZWtVsCjDVPJrhK",
    },
  });

  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>',
    to,
    subject: "Change password",
    html,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
