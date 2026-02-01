const net = require('net');

const server = net.createServer((socket) => {});

server.listen(3001, '0.0.0.0', () => {
  console.log('TCP server is listening on port 3001');
});
