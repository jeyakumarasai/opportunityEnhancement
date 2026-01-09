const approuter = require('@sap/approuter');
const ar = approuter();

ar.beforeResponseHandler.use((req, res, next) => {
  // Remove restrictive header
  res.removeHeader('X-Frame-Options');

  // Allow embedding from your domain(s)
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://my1002011.de1.test.crm.cloud.sap/"
  );

  next();
});

ar.start();
