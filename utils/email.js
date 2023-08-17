const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Double Descent Superstore <temmy4jamb@gmail.com>",
    to: options.email,
    subject: options.subject,
    // text: options.message,
    html: options.html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

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
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, template) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      // text: options.message,
      html: template,
    };

    await this.transporter().sendMail(mailOptions)
  }

  async sendForgotPassword() {
    const html = `
    <h1>Password reset token</h1>
    <p>Forgot your password?</p>
    <div>Hey, from double descent store, click the button below to request a new password</div>
    <button><a href=${this.url}>Forgot password</a></button>
    <p>If you didn't request forget, please ignore this email.</p>
  `;
    await this.send("Your password reset token.", html);
  }

  async sendWelcome(){
    const html = `
      <p>Welcome to double descent superstore!</p>
      <p>We're excited to have you on board</p>
      <p>Feel free to check out our website and place your order (within Lagos state)</p>
      <button><a href=${this.url}>Home page</a></button>
    `
    await this.send("Welcome to Double Descent Superstore.", html);
  };
}

// sendWelcome
// SendOrderConfirmation
// SendForgotPassword
