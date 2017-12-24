var sinchSms = require('sinch-sms')({
  key: 'e602cf6a-02b4-45dd-ba03-d6d0eadb4fb0', 
  secret: 'QUKCHOX1MUKTZHKnbkQMlQ=='
});
var nodemailer = require('nodemailer');

exports.sendSMS = function sendSMS(number, successMessage, errorMessage, callback){
  sinchSms.send(number, successMessage).then(function(response) {
    console.log(response)
    if(callback) callback()
  }).fail(function(error) {
    console.log(error)
    throw {error: errorMessage, status: 400}
  });
}

exports.sendEmail =function sendEmail(emailID, subject, successMessage, errorMessage, callback){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'electionmasterindia@gmail.com',
      pass: 'a@12345678'
    }
  });

  var mailOptions = {
    from: 'charumalhotra200@gmail.com',
    to: emailID,
    subject: subject,
    text: successMessage
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      throw {error: errorMessage, status: 400}
    } else {
      console.log('Email sent: ' + info.response);
      if(callback) callback()
    }
  });
}