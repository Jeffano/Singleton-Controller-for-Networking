// Import required modules
let networkModule = require("net"); // For creating TCP client connections
let fsModule = require("fs"); // For file operations (e.g., writing the received image to disk)
let openFileModule = require("open"); // For opening files with their default application
let ITPRequestPacketModule = require("./ITPRequest"); // Custom module for creating and managing ITP request packets

// Extract server IP address and port from command line arguments
let serverIPandPortArgs = process.argv[3].split(":");
let requestedImageName = process.argv[5]; // The name of the image to request
let itpProtocolVersion = process.argv[7]; // ITP protocol version
let SERVER_PORT_ARG = serverIPandPortArgs[1]; // Server port
let SERVER_HOST_ARG = serverIPandPortArgs[0]; // Server IP address or hostname

// Initialize the ITP request packet with the provided image name and ITP version
ITPRequestPacketModule.init(itpProtocolVersion, requestedImageName);

// Create a new socket for the TCP client connection
let socketClient = new networkModule.Socket();

// Connect to the server using the specified host and port
socketClient.connect(SERVER_PORT_ARG, SERVER_HOST_ARG, function () {
  console.log("Connected to ImageDB server on: " + SERVER_HOST_ARG + ":" + SERVER_PORT_ARG);
  // Write the ITP request packet to the server
  socketClient.write(ITPRequestPacketModule.getBytePacket());
});

// Object mapping response types to their descriptions
let responseTypeMap = {
  0: "Query",
  1: "Found",
  2: "Not found",
  3: "Busy",
};

// Array to collect chunks of data received from the server
const dataSet = [];

// 'data' event handler to collect chunks of data as they are received
socketClient.on("data", (dataChunk) => {
  dataSet.push(dataChunk);
});

// 'pause' event handler - currently only logs when the socket is paused
socketClient.on("pause", () => {
  console.log("pause");
});

// 'end' event handler - processes the received data once the transmission is complete
socketClient.on("end", () => {
  const responsePacket = Buffer.concat(dataSet); // Combine the received data chunks into a single Buffer
  let packetHeader = responsePacket.slice(0, 12); // Extract the packet header
  let packetPayload = responsePacket.slice(12); // Extract the packet payload

  console.log("\nITP packet header received:");
  printPacketBit(packetHeader); // Print the packet header in bit format

  fsModule.writeFileSync(requestedImageName, packetPayload); // Write the payload (image data) to a file

  // Open the received image using the default image viewer
  (async () => {
    await openFileModule(requestedImageName, { wait: true }); // Wait for the opened application to exit before continuing
    process.exit(1); // Exit the process
  })();

  // Log details from the packet header
  console.log("\nServer sent:");
  console.log("    --ITP version = " + parseBitPacket(packetHeader, 0, 4));
  console.log("    --Response Type = " + responseTypeMap[parseBitPacket(packetHeader, 4, 8)]);
  console.log("    --Sequence Number = " + parseBitPacket(packetHeader, 12, 16));
  console.log("    --Timestamp = " + parseBitPacket(packetHeader, 32, 32));
  console.log();
  socketClient.end(); // Close the client socket
  process.exit(1); // Exit the process
});

// 'close' event handler - logs when the connection is closed
socketClient.on("close", function () {
  console.log("Connection closed");
});

// 'end' event handler - logs when disconnected from the server
socketClient.on("end", () => {
  console.log("Disconnected from the server");
});

/**
 * Extracts and returns an integer value from a specified bit segment of a packet.
 * @param {Buffer} packet - The packet buffer.
 * @param {number} offset - The bit offset where the segment starts.
 * @param {number} length - The length of the bit segment.
 * @returns {number} - The integer value of the extracted bit segment.
 */
function parseBitPacket(packet, offset, length) {
  let number = 0;
  for (var i = 0; i < length; i++) {
    let bytePosition = Math.floor((offset + i) / 8); // Calculate byte position
    let bitPosition = 7 - ((offset + i) % 8); // Calculate bit position within the byte
    let bit = (packet[bytePosition] >> bitPosition) & 1; // Extract the bit value
    number = (number << 1) | bit; // Append the bit to the result number
  }
  return number;
}

/**
 * Prints the entire packet in a human-readable bit format.
 * @param {Buffer} packet - The packet to print.
 */
function printPacketBit(packet) {
  var bitString = "";
  for (var i = 0; i < packet.length; i++) {
    var b = "00000000" + packet[i].toString(2); // Convert byte to binary string with leading zeros
    if (i > 0 && i % 4 == 0) bitString += "\n"; // Insert a newline every 4 bytes for readability
    bitString += " " + b.substr(b.length - 8); // Append the last 8 bits (one byte) to the string
  }
  console.log(bitString);
}
