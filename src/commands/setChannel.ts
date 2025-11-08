import { SlashCommandBuilder } from "discord.js";
import Notification from "../models/notification";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Sets the channel for YSWS notifications.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to set for notifications")
        .setRequired(true)
    ),
  async execute(interaction: any) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guildId;

    try {
      const existingNotification = await Notification.findOne({ guildId });
      if (existingNotification) {
        existingNotification.channelId = channel.id;
        await existingNotification.save();
      } else {
        const newNotification = new Notification({
          guildId,
          channelId: channel.id,
        });
        await newNotification.save();
      }
      await interaction.reply({
        content: `Notification channel set to ${channel.name}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error setting notification channel:", error);
      await interaction.reply({
        content: "There was an error setting the notification channel.",
        ephemeral: true,
      });
      return;
    }
  },
};
