import "dotenv/config";
import { sentence } from "@ndaidong/txtgen";
import {
  Client,
  type XmtpEnv,
} from "@xmtp/node-sdk";
import {createSigner, getEncryptionKeyFromHex} from "./helpers/client";

/* Get the wallet key associated to the public key of
 * the agent and the encryption key for the local db
 * that stores your agent's messages */
const { WALLET_KEY, ENCRYPTION_KEY } = process.env;

/* Check if the environment variables are set */
if (!WALLET_KEY) {
  throw new Error("WALLET_KEY must be set");
}

/* Check if the encryption key is set */
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY must be set");
}

/* Create the signer using viem and parse the encryption key for the local db */
const signer = createSigner(WALLET_KEY);
const encryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

/* Set the environment to local, dev or production */
const env: XmtpEnv = process.env.XMTP_ENV as XmtpEnv;

/**
 * Main function to run the agent
 */
async function main() {
  console.log(`Creating client on the '${env}' network...`);
  /* Initialize the xmtp client */
  const client = await Client.create(signer, encryptionKey, {
    env,
  });

  console.log("Syncing conversations...");
  /* Sync the conversations from the network to update the local db */
  await client.conversations.sync();

  const identifier = await signer.getIdentifier();
  const address = identifier.identifier;
  console.log(
      `Agent initialized on ${address}\nSend a message on http://xmtp.chat/dm/${address}?env=${env}`,
  );

  console.log("Waiting for messages...");
  /* Stream all messages from the network */
  const stream = client.conversations.streamAllMessages();
  const activeChaosLoops = new Map<string, NodeJS.Timeout>();

  for await (const message of await stream) {
    const senderId = message?.senderInboxId?.toLowerCase();
    const content = message?.content?.toLowerCase();
    const isText = message?.contentType?.typeId === "text";

    if (
        !senderId ||
        senderId === client.inboxId.toLowerCase() ||
        !isText ||
        !content?.startsWith("/chaos")
    ) {
      continue;
    }

    console.log(
        `Received message: ${message.content} by ${message.senderInboxId}`,
    );

    const conversation = client.conversations.getDmByInboxId(senderId);
    if (!conversation) {
      console.log("Unable to find conversation, skipping");
      continue;
    }

    const args = content.split(" ");
    const command = args[1];

    // Stop command
    if (command === "stop") {
      const intervalId = activeChaosLoops.get(senderId);
      if (intervalId) {
        clearInterval(intervalId);
        activeChaosLoops.delete(senderId);
        await conversation.send("Chaos stopped.");
      } else {
        await conversation.send("No chaos in progress.");
      }
      continue;
    }

    // Parse optional parameters
    let intervalSec = parseInt(args[1]);
    let messageCount = parseInt(args[2]);

    if (isNaN(intervalSec)) intervalSec = 1;
    if (isNaN(messageCount)) messageCount = 10;

    intervalSec = Math.max(1, Math.min(intervalSec, 60)); // 1-60 seconds
    messageCount = Math.max(1, Math.min(messageCount, 100)); // 1-100 messages

    await conversation.send(
        `Chaos starting: ${messageCount} messages every ${intervalSec} second(s).`,
    );

    let count = 0;

    const intervalId = setInterval(async () => {
      if (count >= messageCount) {
        clearInterval(intervalId);
        activeChaosLoops.delete(senderId);
        await conversation.send("Chaos complete.");
        return;
      }
      try {
        await conversation.send(`${count + 1}: ${sentence()}`);
      } catch (error) {
        console.error("Error sending message:", error);
        clearInterval(intervalId);
        activeChaosLoops.delete(senderId);
      }

      count++;
    }, intervalSec * 1000);

    activeChaosLoops.set(senderId, intervalId);
  }
}

main().catch(console.error);
