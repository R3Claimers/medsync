// This test assumes you have a function like generateAdminWelcomeEmail({ name, email, password, hospital })
// If not, you can replace it with the actual function or mock it for now.

const generateAdminWelcomeEmail = ({ name, email, password, hospital }) => {
  // Mock implementation for testing
  return `
    <div>
      <h2>Welcome to MedSync!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your admin account has been created for <strong>${hospital}</strong>.</p>
      <div>
        <h3>Login Credentials:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
      </div>
    </div>
  `;
};

test('Email template function should generate valid HTML with dynamic data', () => {
  const sampleData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secure123',
    hospital: 'City Hospital'
  };
  const html = generateAdminWelcomeEmail(sampleData);
  expect(typeof html).toBe('string');
  expect(html).toContain(sampleData.name);
  expect(html).toContain(sampleData.email);
  expect(html).toContain(sampleData.password);
  expect(html).toContain(sampleData.hospital);
  // Basic HTML structure check
  expect(html).toMatch(/<div>[\s\S]*<h2>[\s\S]*<\/h2>[\s\S]*<\/div>/);
});
