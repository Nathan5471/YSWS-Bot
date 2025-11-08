# YSWS Bot

## Description

YSWS Bot is a Discord bot that is used to notify you when a new You Ship We Ship (YSWS) is added to ysws.hackclub.com. It uses the RSS feed from the website to check for when new ones are added. Join the test discord server here: <https://discord.gg/RHjQsDGJBQ>.

## How To Use

1. Invite the bot to your Discord server: <https://discord.com/oauth2/authorize?client_id=1436145087913529366&permissions=3072&integration_type=0&scope=bot>
2. Use the command `/setchannel` to set the channel where you want the notifications to be send (there is no default channel).
3. You're done!

## Issues

Right now I don't interpret the `<a>` tag and anyone can run /setchannel, so it's not super secure.

## Commands

- `/setchannel` - Choose a channel to send notifications to
- `/ping` - Check if the bot is working
