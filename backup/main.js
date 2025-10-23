const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('cert.key'), // Replace with your key file name
  cert: fs.readFileSync('cert.crt') // Replace with your certificate file name
};

https.createServer(options, (req, res) => {
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found!');
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(4433, () => {
  console.log('HTTPS server running on https://100.76.187.58:4433');
});