import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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
    status: "online",
    activities: [
      {
        name: "YSWS Bot",
        type: 0,
      },
    ],
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
