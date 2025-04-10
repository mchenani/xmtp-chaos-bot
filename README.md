# XMTP Chaos Bot

This agent responds to `/chaos` commands by sending randomly generated messages at set intervals.

## Setup

1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-org/xmtp-chaos-bot.git
   cd xmtp-chaos-bot
   ```

2. **Install dependencies**  
   ```bash
   yarn install
   ```

3. **Set up environment variables**  
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Fill in the following variables in `.env`:
     - `WALLET_KEY`: Your wallet's private key
     - `ENCRYPTION_KEY`: A 32-byte hex string used to encrypt the local database
     - `OPENAI_API_KEY`: Your OpenAI API key (obtain one from [platform.openai.com](https://platform.openai.com))

## Usage

1. **Start the bot**  
   ```bash
   yarn start
   ```

2. **Send default chaos command**  
   Send the following message to the bot:
   ```
   /chaos
   ```
   This will trigger the bot to send 10 messages at 1-second intervals to the group.

3. **Customize chaos behavior**  
   Use the format `/chaos <interval> <count>` to define your own interval (in seconds) and message count.  
   For example:
   ```
   /chaos 5 20
   ```
   This will send 20 messages with a 5-second delay between each.
