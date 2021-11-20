const Discord = require('discord.js');
const client  = new Discord.Client({
    intents: 4609,
    partials: ['CHANNEL']
});
const { token, serverID, categoryID, footer } = require('./config.js')
const fs = require('fs')
client.commands = new Discord.Collection();
const { Routes } = require('discord-api-types/v9');
const commandFolders = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const { REST } = require('@discordjs/rest');
let guild
let categoryChannel
const commands = [];
for (const file of commandFolders) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());  
    client.commands.set(command.data.name, command);
    
}



client.on('ready', async () => {
    console.log('started')
    client.user.setActivity('my DMs for tickets!', { type: 'WATCHING' });


    guild = await client.guilds.fetch(serverID)
    categoryChannel = await guild.channels.fetch(categoryID)
    const rest = new REST({ version: '9' }).setToken(token);

    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, serverID),
                { body: commands },
            );

            console.log('Successfully registered application commands.');
        } catch (error) {
            console.error(error);
        }
    })();

})

function sendMessage(message, channel, colour) {
    let attachments = [];
    if(message.attachments.size > 0) {
        message.attachments.forEach(curr => {
            attachments.push(new Discord.MessageAttachment(curr.attachment))
        })
    }
    const embed = new Discord.MessageEmbed()
        .setColor(colour)
        .setAuthor(`${message.author.tag}`, `${message.author.displayAvatarURL()}`)
        .setDescription(`${message.content}`)
        .setFooter(`${footer} - Made By Cryptonized`)
        channel.send({ embeds: [embed], files: attachments})
    message.react('✅')
}


client.on('messageCreate', async(message) => {
    if(message.author.bot) return;
    if(message.channel.type === 'DM') {
        const isOpen = categoryChannel.children.filter(x => x.topic === message.author.id)
        
        if(!isOpen.first()) {
            const chann = await guild.channels.create(`${message.author.username}`, {
                type: 'GUILD_TEXT',
                parent: categoryChannel,
                topic: `${message.author.id}`
            })
            
            sendMessage(message, chann, 'GREEN')

            const embedUser = new Discord.MessageEmbed()
                .setColor('GREEN')
                .setAuthor('Successfully created ticket!')
                .setDescription(`A new ticket has been created with the following content: \n\`\`\`${message.content}\`\`\`\n\nAny attachments will also be forwarded! You can follow up / reply to this ticket by sending another message, assuming it is still open!`)
                .setFooter(`${footer} - Made By Cryptonized`)

            message.channel.send({ embeds: [embedUser]})
        }
        else {
            sendMessage(message, isOpen.first(), 'GREEN')
            
        }
    }
    else if(message.channel.type === 'GUILD_TEXT') {
        if(!message.channel.topic) return;
        if(message.channel.parent.id !== categoryID) return;
        const user = await client.users.fetch(message.channel.topic)
        if(!user) return message.reply({ content: 'Couldn\'t find the owner of this ticket anymore!'});
        sendMessage(message, user, 'ORANGE')
    }
})

client.on('interactionCreate', async(interaction) => {
if(interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
})

client.login(token)
