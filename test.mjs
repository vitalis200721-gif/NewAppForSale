import net from "net";

const server = net.createServer(() => {});

server.listen(3001, "0.0.0.0", () => {
  console.log("TCP SERVER LISTENING ON 3001");
});
