import { SlashCommandBuilder } from "discord.js";
import Notification from "../models/notification";
import YSWS from "../models/ysws";
import { MessageFlags } from "discord.js";

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
        existingNotification.pastSent = false;
        await existingNotification.save();
      } else {
        const newNotification = new Notification({
          guildId,
          channelId: channel.id,
          pastSent: false,
        });
        await newNotification.save();
      }
      await interaction.reply({
        content: `Notification channel set to ${channel.name}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error setting notification channel:", error);
      await interaction.reply({
        content: "There was an error setting the notification channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  },
};
