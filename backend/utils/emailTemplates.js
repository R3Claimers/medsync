// Utility functions for generating HTML email templates

function adminWelcomeEmail({ name, email, password, hospital }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to MedSync!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your admin account has been created for <strong>${hospital}</strong>.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Login Credentials:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${password}</code></p>
      </div>
    </div>
  `;
}

function doctorWelcomeEmail({ name, email, password, specialty }) {
  return `
    <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h4 style="color: #374151; margin-top: 0;">Your Login Credentials:</h4>
      <p style="margin: 10px 0;"><strong>Email:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${email}</code></p>
      <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
      <p style="margin: 10px 0;"><strong>Role:</strong> Doctor</p>
      ${specialty ? `<p style="margin: 10px 0;"><strong>Specialty:</strong> ${specialty}</p>` : ''}
    </div>
  `;
}

module.exports = {
  adminWelcomeEmail,
  doctorWelcomeEmail
};
