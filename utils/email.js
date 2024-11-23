const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.mailgun.org",
//     port: 465,
//     auth: {
//       user: "postmaster@sandbox73560610ec8c424f9ee4435c42c6d402.mailgun.org",
//       pass: "4e87beb9154937b0b9ccbad720d39ec8-7ca144d2-f80b874a",
//     },
//   });
//   // port = 465 || 25 || 587

//   const mailOptions = {
//     from: "Double Descent Superstore <temmy4jamb@gmail.com>",
//     to: options.email,
//     subject: options.subject,
//     // text: options.message,
//     html: options.html,
//   };
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

/*

Hello [recipient’s name],

We’re super excited to see you join the [online store] community.

We hope you will be happy with [products offered by the online store] and that you will shop with us again and again.

Our goal is to offer the widest range of [products offered by the online store] at the highest quality. If you think we should add any items to our store, don’t hesitate to contact us and share your feedback.

Until then, enjoy your shopping!

Best,
[store owner’s signature]

*/

class Email {
  // Stripe sends receipt after transaction
  constructor(user, url) {
    (this.from = "Double Descent Superstore <temmy4jamb@gmail.com>"),
      (this.to = user.email),
      (this.name = user.name),
      (this.url = url);
  }

  // create transporter
  transporter() {
    return nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 465,
      auth: {
        user: "postmaster@sandbox73560610ec8c424f9ee4435c42c6d402.mailgun.org",
        pass: "4e87beb9154937b0b9ccbad720d39ec8-7ca144d2-f80b874a",
      },
    });
  }

  async send(subject, html) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      // text: options.message,
      html,
    };

    await this.transporter().sendMail(mailOptions);
  }

  async sendForgotPassword() {
    const html = `
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
          <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #007bff; color: #ffffff; text-align: center; padding: 20px;">
                  <h1 style="margin: 0; font-size: 24px;">Double Decent</h1>
              </div>
              <div style="padding: 20px; color: #333333; line-height: 1.6;">
                  <p style="margin: 16px 0;">Hi ${this.name},</p>
                  <p style="margin: 16px 0;">We received a request to reset your password for your Double Decent account. Click the button below to reset your password:</p>
                  <a href="${this.url}" style="display: block; width: fit-content; margin: 20px auto; padding: 12px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; text-align: center;">Reset Password</a>
                  <p style="margin: 16px 0;">If you didn’t request a password reset, you can ignore this email. Your password will remain unchanged.</p>
                  <p style="margin: 16px 0;">Thank you for shopping with Double Decent!</p>
                  <p style="margin: 16px 0;">- The Double Decent Team</p>
              </div>
              <div style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 12px; color: #777777;">
                  <p style="margin: 8px 0;">Need help? <a href="https://doubledecent/com/support" style="color: #007bff; text-decoration: none;">Contact us</a></p>
                  <p style="margin: 8px 0;">&copy; 2024 Double Decent. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>

  `;
    await this.send("Your password reset token.", html);
  }

  async sendWelcome() {
    const html = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333;">Welcome to Our E-commerce Store!</h1>
        <p style="color: #666;">Dear ${this.name},</p>
        <p style="color: #666;">We’re super excited to see you join the Double Descent superstore community. Thank you for choosing us for your shopping needs. Our team is dedicated to providing you with a great shopping experience.</p>
        <p style="color: #666;">Here are some of the things you can expect from our store:</p>
        <ul>
            <li style="color: #666;">Wide selection of high-quality products</li>
            <li style="color: #666;">Competitive prices and exclusive discounts</li>
            <li style="color: #666;">Fast and secure checkout process</li>
            <li style="color: #666;">Excellent customer support</li>
        </ul>
        <p style="color: #666;">Our goal is to offer you the widest range of products at the highest quality. If you think we should add any items to our store, don’t hesitate to contact us and share your feedback.</p>
        <p style="color: #666;">Start exploring our products and enjoy shopping with us!</p>
        <a href=${this.url} target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 3px; margin-top: 20px;">Shop Now</a>
        <p style="color: #666;">If you have any questions or need assistance, feel free to contact our customer support team.</p>
        <p style="color: #666;">Thank you for choosing us. We look forward to serving you.</p>
        <p style="color: #666;">Sincerely,<br>Your E-commerce Team</p>
    </div>
</body>
  `;
    await this.send("Welcome to Double Descent Superstore.", html);
  }
}

module.exports = Email;

// sendWelcome
// SendOrderConfirmation
// SendForgotPassword
