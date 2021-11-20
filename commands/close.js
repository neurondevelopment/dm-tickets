const { SlashCommandBuilder } = require('@discordjs/builders');
const { categoryID, ticketCloseMessage, footer } = require('../config')
const Discord = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Closes the current ticket'),
    async execute(interaction) {
        if(!interaction.channel.topic) return;
        if(interaction.channel.parent.id !== categoryID) return;
        const user = await interaction.client.users.fetch(interaction.channel.topic)
        const embed = new Discord.MessageEmbed()
            .setColor('RED')
            .setAuthor(`${interaction.user.tag}`, `${interaction.user.displayAvatarURL()}`)
            .setDescription(`${ticketCloseMessage}`)
            .setFooter(`${footer} - Made By Cryptonized`)
        user.send({ embeds: [embed] })
        interaction.channel.delete()
    },
};
