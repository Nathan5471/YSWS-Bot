import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PresenceUpdateStatus,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import cron from "node-cron";
import yswsDetector from "./schedulers/yswsDetector";
import { YSWSType } from "./models/ysws";
import Notification from "./models/notification";

dotenv.config();

interface ExtendedClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as ExtendedClient;

client.commands = new Collection();

const folderPath = path.join(__dirname, "commands");

const commandFiles = fs
  .readdirSync(folderPath)
  .filter((file) => file.endsWith(".ts"));
for (const file of commandFiles) {
  const filePath = path.join(folderPath, file);
  import(filePath).then((command) => {
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  });
}

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error(
    "BOT_TOKEN is not defined in .env. See .env.example for reference."
  );
}
const clientId = process.env.CLIENT_ID;
if (!clientId) {
  throw new Error(
    "CLIENT_ID is not defined in .env. See .env.example for reference."
  );
}

const deployCommands = async () => {
  try {
    const commands = [];
    const commandFiles = fs
      .readdirSync(path.join(__dirname, "commands"))
      .filter((file) => file.endsWith(".ts"));

    for (const file of commandFiles) {
      const command = await import(`./commands/${file}`);
      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(
          `The command at ${file} is missing a required "data" or "execute" property.`
        );
      }
    }

    const rest = new REST().setToken(token);
    console.log(
      `Started refreshing ${commands.length} application (/) commands globally.`
    );
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log("Successfully reloaded all commands");
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
};

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  await deployCommands();
  console.log("Commands deployed globally.");

  client.user?.setPresence({
    status: PresenceUpdateStatus.Online,
  });

  console.log("Presence set.");
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = (interaction.client as ExtendedClient).commands.get(
    interaction.commandName
  );
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command :(",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command :(",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(token);

const mongooseURL = process.env.MONGODB_URL;
if (!mongooseURL) {
  throw new Error(
    "MONGODB_URL is not defined in .env. See .env.example for reference."
  );
}

mongoose
  .connect(mongooseURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

cron.schedule("* * * * *", async () => {
  const newYSWSs = (await yswsDetector()) as YSWSType[];
  if (!newYSWSs || newYSWSs.length === 0) {
    console.log("No new YSWS entries detected.");
    return;
  }
  const notifications = await Notification.find();
  for (const notification of notifications) {
    const guild = await client.guilds.fetch(notification.guildId);
    if (!guild) {
      console.warn(`Guild not found: ${notification.guildId}`);
      continue;
    }
    const channel = await guild.channels.fetch(notification.channelId);
    if (!channel || !channel.isTextBased()) {
      console.warn(
        `Channel not found or is not text-based: ${notification.channelId} in guild ${notification.guildId}`
      );
      continue;
    }
    for (const ysws of newYSWSs) {
      await channel.send(
        `**${ysws.title}**\n${ysws.link}\n${ysws.description}`
      );
    }
    console.log(
      `Sent ${newYSWSs.length} new YSWS notifications to guild ${guild.id}`
    );
  }
});
